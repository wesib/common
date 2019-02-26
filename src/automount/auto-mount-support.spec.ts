import {
  ArraySet,
  AutoConnectSupport,
  bootstrapComponents,
  BootstrapContext,
  BootstrapRoot,
  BootstrapWindow,
  Class,
  ElementAdapter,
  Feature,
  FeatureDef,
  featureDefSymbol,
} from '@wesib/wesib';
import { noop } from 'call-thru';
import { ObjectMock } from '../spec/mocks';
import { autoMountSupport, AutoMountSupport } from './auto-mount-support.feature';
import Mock = jest.Mock;

describe('automount/auto-mount-support', () => {

  let mockWindow: ObjectMock<Window>;
  let mockDocument: ObjectMock<Document>;
  let domContentLoaded: () => void;
  let mockObserver: ObjectMock<MutationObserver>;
  let mockRoot: {
    querySelectorAll: Mock<any[], [string]>;
    addEventListener: Mock;
  };
  let mockAdapter: ElementAdapter;
  let bootstrapContext: BootstrapContext;

  beforeEach(() => {
    domContentLoaded = noop;
    mockObserver = {
      observe: jest.fn(),
    } as any;
    mockDocument = {
      readyState: 'interactive',
      addEventListener: jest.fn((event, listener) => {
        if (event === 'DOMContentLoaded') {
          domContentLoaded = listener;
        }
      }),
      removeEventListener: jest.fn(),
    } as any;
    mockWindow = {
      MutationObserver: jest.fn(() => mockObserver),
      document: mockDocument,
    } as any;
    mockRoot = {
      querySelectorAll: jest.fn(selector => []),
      addEventListener: jest.fn(),
    };
    mockAdapter = jest.fn();
  });

  describe('AutoMountSupport', () => {
    it('caches feature definition', () => {
      expect(AutoMountSupport[featureDefSymbol]).toBe(AutoMountSupport[featureDefSymbol]);
    });
    it('enables `AutoConnectSupport`', () => {
      expect([...new ArraySet(FeatureDef.of(AutoMountSupport).need)]).toContain(AutoConnectSupport);
    });
    it('adapts all elements', () => {
      bootstrap(AutoMountSupport);

      expect(mockRoot.querySelectorAll).toHaveBeenCalledWith('*');
    });
  });
  describe('autoMountSupport', () => {
    it('does not adapt elements when disabled', () => {
      bootstrap(autoMountSupport({ select: false }));

      expect(mockRoot.querySelectorAll).not.toHaveBeenCalled();
    });
    it('adapts all elements when `select` set to `true`', () => {
      bootstrap(autoMountSupport({ select: true }));

      expect(mockRoot.querySelectorAll).toHaveBeenCalledWith('*');
    });
    it('selects elements to adapt', () => {

      const selector = 'some';

      bootstrap(autoMountSupport({ select: selector }));

      expect(mockRoot.querySelectorAll).toHaveBeenCalledWith(selector);
    });
    it('adapts selected elements', () => {

      const element1 = { name: 'element1' };
      const element2 = { name: 'element2' };

      mockRoot.querySelectorAll.mockImplementation(() => [element1, element2]);

      bootstrap(autoMountSupport());

      expect(mockAdapter).toHaveBeenCalledWith(element1);
      expect(mockAdapter).toHaveBeenCalledWith(element2);
    });
    it('does not register DOMContentLoaded listener if document is loaded', () => {
      bootstrap(autoMountSupport());

      expect(mockDocument.addEventListener).not.toHaveBeenLastCalledWith('DOMContentLoaded', expect.any(Function));
    });
    it('registers DOMContentLoaded listener if document is not loaded', () => {
      (mockDocument as any).readyState = 'loading';

      bootstrap(autoMountSupport());
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', domContentLoaded, undefined);
      expect(mockRoot.querySelectorAll).not.toHaveBeenCalled();

      domContentLoaded();
      expect(mockRoot.querySelectorAll).toHaveBeenCalled();
      expect(mockDocument.removeEventListener).toHaveBeenCalledWith('DOMContentLoaded', domContentLoaded);
    });
  });

  function bootstrap(...features: Class[]) {

    @Feature({
      set: [
        { a: BootstrapWindow, is: mockWindow },
        { a: BootstrapRoot, is: mockRoot },
        { a: ElementAdapter, is: mockAdapter }
      ],
      init(context) {
        bootstrapContext = context;
      }
    })
    class TestFeature {
    }

    return bootstrapComponents(TestFeature, ...features);
  }
});
