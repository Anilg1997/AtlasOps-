import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CopilotService, ChatMessage, Conversation } from './copilot.service';

describe('CopilotService', () => {
  let service: CopilotService;
  let httpMock: HttpTestingController;

  const mockChat: ChatMessage = {
    response: 'ORD-1001 is on hold.',
    conversationId: 'conv-1'
  };

  const mockConversation: Conversation = {
    id: 'conv-1',
    userId: 'web-user',
    title: 'Why is ORD-1001 on hold?',
    messages: [
      { role: 'user', content: 'Why is ORD-1001 on hold?', timestamp: new Date().toISOString() },
      { role: 'assistant', content: 'ORD-1001 is on hold.', timestamp: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CopilotService]
    });
    service = TestBed.inject(CopilotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post a chat message with the web-user id', () => {
    service.chat('Hello').subscribe(res => {
      expect(res.conversationId).toBe('conv-1');
    });

    const req = httpMock.expectOne('/api/v1/copilot/chat');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'Hello', userId: 'web-user' });
    req.flush(mockChat);
  });

  it('should include the conversation id when provided', () => {
    service.chat('Hello', 'conv-1').subscribe();

    const req = httpMock.expectOne('/api/v1/copilot/chat');
    expect(req.request.body).toEqual({ message: 'Hello', userId: 'web-user', conversationId: 'conv-1' });
    req.flush(mockChat);
  });

  it('should fetch conversations for the web user', () => {
    service.getConversations().subscribe(convs => {
      expect(convs.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/v1/copilot/conversations?userId=web-user');
    expect(req.request.method).toBe('GET');
    req.flush([mockConversation]);
  });

  it('should fetch a single conversation', () => {
    service.getConversation('conv-1').subscribe(conv => {
      expect(conv.id).toBe('conv-1');
    });

    const req = httpMock.expectOne('/api/v1/copilot/conversations/conv-1');
    expect(req.request.method).toBe('GET');
    req.flush(mockConversation);
  });
});
