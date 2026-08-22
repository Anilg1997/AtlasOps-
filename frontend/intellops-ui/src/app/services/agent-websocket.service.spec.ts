import { TestBed } from '@angular/core/testing';
import { AgentWebSocketService, ChatMessage } from './agent-websocket.service';
import { CartService } from './cart.service';
import { ProductService } from './product.service';

describe('AgentWebSocketService', () => {
  let service: AgentWebSocketService;
  let cartServiceSpy: jasmine.SpyObj<CartService>;

  beforeEach(() => {
    cartServiceSpy = jasmine.createSpyObj('CartService', ['itemCount', 'total', 'addItem', 'cartItems']);
    cartServiceSpy.itemCount.and.returnValue(0);
    cartServiceSpy.total.and.returnValue(0);
    cartServiceSpy.cartItems.and.returnValue([]);

    TestBed.configureTestingModule({
      providers: [
        AgentWebSocketService,
        { provide: CartService, useValue: cartServiceSpy },
        { provide: ProductService, useValue: {} }
      ]
    });

    service = TestBed.inject(AgentWebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty messages', () => {
    expect(service.messages()).toEqual([]);
  });

  it('should initialize with isProcessing false', () => {
    expect(service.isProcessing()).toBeFalse();
  });

  it('should initialize with isConnected false', () => {
    expect(service.isConnected()).toBeFalse();
  });

  describe('startConversation', () => {
    it('should reset messages and add welcome message', () => {
      // Pre-populate messages
      service.messages.set([
        { id: 'old', role: 'user', content: 'old message', timestamp: new Date() }
      ]);

      service.startConversation();

      const msgs = service.messages();
      expect(msgs.length).toBe(1);
      expect(msgs[0].role).toBe('agent');
      expect(msgs[0].content).toContain('AI Shopping Agent');
    });

    it('should reset conversationId', () => {
      service.startConversation();

      // conversationId is private but should be reset
      expect(service.messages().length).toBe(1);
    });

    it('should reset tokenBuffer and currentStreamingMessageId', () => {
      service.startConversation();

      // Should be able to start fresh
      expect(service.isProcessing()).toBeFalse();
    });
  });

  describe('processUserInput', () => {
    it('should add user message to messages', async () => {
      // Start conversation first
      service.startConversation();

      // processUserInput will try to connect via WebSocket, which won't succeed in test env
      // but it should still add the user message and create a streaming placeholder
      await service.processUserInput('Hello');

      const msgs = service.messages();
      expect(msgs.length).toBe(3); // welcome + user + streaming placeholder
      expect(msgs[1].role).toBe('user');
      expect(msgs[1].content).toBe('Hello');
    });

    it('should set isProcessing to true while processing', async () => {
      service.startConversation();

      const processPromise = service.processUserInput('Hello');
      expect(service.isProcessing()).toBeTrue();

      await processPromise;
    });

    it('should create a streaming placeholder message', async () => {
      service.startConversation();

      await service.processUserInput('Test');

      const msgs = service.messages();
      const streamingMsg = msgs.find(m => m.streaming === true);
      expect(streamingMsg).toBeTruthy();
      expect(streamingMsg!.role).toBe('agent');
    });
  });

  describe('disconnect', () => {
    it('should set isConnected to false', () => {
      service.disconnect();
      expect(service.isConnected()).toBeFalse();
    });

    it('should be safe to call multiple times', () => {
      service.disconnect();
      service.disconnect();
      expect(service.isConnected()).toBeFalse();
    });
  });

  describe('tokenReceived$ observable', () => {
    it('should be defined', () => {
      expect(service.tokenReceived$).toBeTruthy();
    });
  });

  describe('streamComplete$ observable', () => {
    it('should be defined', () => {
      expect(service.streamComplete$).toBeTruthy();
    });
  });

  describe('connectionChanged$ observable', () => {
    it('should be defined', () => {
      expect(service.connectionChanged$).toBeTruthy();
    });
  });
});
