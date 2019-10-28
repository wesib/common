import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { EventEmitter, EventReceiver, EventSupply, eventSupply, onEventBy, onPromise } from 'fun-events';
import { HttpFetch } from '../../fetch';
import { Page } from '../page';
import { PageLoadAgent } from './page-load-agent';
import { PageLoadResponse } from './page-load-response';
import { PageLoader } from './page-loader.impl';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('navigation', () => {

  let mockHttpFetch: Mock<ReturnType<HttpFetch>, Parameters<HttpFetch>>;
  let page: Page;
  let mockResponse: Mocked<Response>;
  let mockResponseHeaders: Mocked<Headers>;

  beforeEach(() => {
    page = { url: new URL('http://localhost/test') } as Page;
    mockResponseHeaders = {
      get: jest.fn(),
    } as any;
    mockResponse = {
      ok: true,
      text: jest.fn(),
      headers: mockResponseHeaders,
    } as any;

    mockHttpFetch = jest.fn((_input, _init?) => onPromise(Promise.resolve(mockResponse)));
  });

  let bsContext: BootstrapContext;
  let mockAgent: Mock<ReturnType<PageLoadAgent>, Parameters<PageLoadAgent>>;

  beforeEach(async () => {
    mockAgent = jest.fn((next, _request) => next());

    @Feature({
      set: [
        { a: HttpFetch, is: mockHttpFetch },
        { a: PageLoadAgent, is: mockAgent },
      ],
    })
    class TestFeature {}

    bsContext = await new Promise(resolve => {

      const ctx = bootstrapComponents(TestFeature);

      ctx.whenReady(() => resolve(ctx));
    });
  });

  describe('PageLoader', () => {

    let loadPage: PageLoader;

    beforeEach(() => {
      loadPage = bsContext.get(PageLoader);
    });

    it('is available in bootstrap context', () => {
      expect(loadPage).toBeInstanceOf(Function);
    });
    it('fetches document', async () => {
      mockResponse.text.mockImplementation(() => Promise.resolve('<div>test</div>'));

      await loadDocument();

      expect(mockHttpFetch).toHaveBeenCalledWith(expect.any(Request));

      const request = mockHttpFetch.mock.calls[0][0] as Request;

      expect(request.url).toBe('http://localhost/test');
      // expect(request.mode).toBe('navigate');
      // expect(request.credentials).toBe('same-origin');
      expect(request.headers.get('Accept')).toBe('text/html');
    });
    it('parses the response as HTML by default', async () => {
      mockResponse.text.mockImplementation(() => Promise.resolve('<div>test</div>'));

      const receiver = jest.fn();
      const done = jest.fn();
      const supply = await loadDocument(receiver, done);

      expect(receiver).toHaveBeenCalled();
      expect(supply.isOff).toBe(true);
      expect(done).toHaveBeenCalledWith(undefined);

      const document = receiver.mock.calls[0][0]!.document;
      const div: Element = document.querySelector('div') as Element;

      expect(div.ownerDocument).toBeInstanceOf(HTMLDocument);
      expect(div).toBeInstanceOf(HTMLDivElement);
      expect(div.textContent).toBe('test');
    });
    it('parses the response accordingly to `Context-Type` header', async () => {
      mockResponseHeaders.get.mockImplementation(_name => 'application/xml; charset=utf-8');
      mockResponse.text.mockImplementation(
          () => Promise.resolve('<?xml version="1.0"?><content>test</content>'));

      const receiver = jest.fn();
      const done = jest.fn();
      const supply = await loadDocument(receiver, done);

      expect(receiver).toHaveBeenCalled();
      expect(supply.isOff).toBe(true);
      expect(done).toHaveBeenCalledWith(undefined);

      const document = receiver.mock.calls[0][0]!.document;
      const content = document.querySelector('content') as Node;

      expect(content).toBeInstanceOf(Element);
      expect(content).not.toBeInstanceOf(HTMLElement);
      expect(content.textContent).toBe('test');
    });
    it('reports fetch error', async () => {

      const error = new Error('Some error');

      mockHttpFetch = jest.fn((_input, _init?) => onEventBy(() => {

        const failedSupply = eventSupply();

        failedSupply.off(error);

        return failedSupply;
      }));

      const receiver = jest.fn();
      const done = jest.fn();

      mockResponse.text.mockImplementation(() => Promise.reject(error));

      const supply = await loadDocument(receiver, done);

      expect(receiver).not.toHaveBeenCalled();
      expect(supply.isOff).toBe(true);
      expect(done).toHaveBeenCalledWith(error);
    });
    it('reports invalid HTTP response', async () => {
      (mockResponse as any).ok = false;
      (mockResponse as any).status = 404;
      mockResponse.text.mockImplementation(() => Promise.resolve('dhfdfhfhg'));

      const receiver = jest.fn();
      const done = jest.fn();
      const supply = await loadDocument(receiver, done);

      expect(receiver).toHaveBeenCalledWith({ ok: false, page, response: mockResponse, error: mockResponse.status });
      expect(supply.isOff).toBe(true);
      expect(done).toHaveBeenCalled();
    });
    it('reports parse error', async () => {
      mockResponseHeaders.get.mockImplementation(
          name => name.toLowerCase() === 'content-type' ? 'application/x-wrong' : null);
      mockResponse.text.mockImplementation(() => Promise.resolve('dhfdfhfhg'));

      const receiver = jest.fn();
      const done = jest.fn();
      const supply = await loadDocument(receiver, done);

      expect(receiver).toHaveBeenCalledWith({ ok: false, page, response: mockResponse, error: expect.any(Object) });
      expect(supply.isOff).toBe(true);
      expect(done).toHaveBeenCalled();
    });
    it('calls agent', async () => {

      const newResponse: PageLoadResponse = {
        ok: true,
        page,
        response: { name: 'response' } as any,
        document: document.implementation.createHTMLDocument('other'),
      };

      mockAgent.mockImplementation(() => {

        const emitter = new EventEmitter<[PageLoadResponse]>();

        Promise.resolve().then(() => emitter.send(newResponse)).then(() => emitter.done());

        return emitter.on;
      });

      const receiver = jest.fn();

      await loadDocument(receiver);

      expect(receiver).toHaveBeenCalledWith(newResponse);
      expect(mockHttpFetch).not.toHaveBeenCalled();
    });

    function loadDocument(
        receiver: EventReceiver<[PageLoadResponse]> = noop,
        done: (reason?: any) => void = noop,
    ): Promise<EventSupply> {
      return new Promise<EventSupply>(resolve => {

        const supply = loadPage(page)(receiver);

        supply.whenOff(reason => {
          done(reason);
          resolve(supply);
        });
      });
    }
  });

});
