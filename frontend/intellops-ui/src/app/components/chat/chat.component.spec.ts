import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ChatComponent } from './chat.component';
import { CopilotService, ChatMessage } from '../../services/copilot.service';
import { ToastService } from '../../services/notification/toast.service';

describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;
  let copilotServiceSpy: jasmine.SpyObj<CopilotService>;

  const responseWithEvidence: ChatMessage = {
    response: 'ORD-1001 was created, then placed on hold awaiting payment.',
    conversationId: 'conv-1',
    evidence: [
      {
        tool: 'ActivityTool',
        method: 'getActivityTimeline',
        entityType: 'ORDER',
        entityId: 'ORD-1001',
        events: [
          {
            id: '1',
            eventType: 'ORDER_CREATED',
            source: 'order-service',
            entityId: 'ORD-1001',
            entityType: 'ORDER',
            details: { status: 'PENDING' },
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            eventType: 'ORDER_STATUS_CHANGED',
            source: 'order-service',
            entityId: 'ORD-1001',
            entityType: 'ORDER',
            details: { status: 'ON_HOLD' },
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    copilotServiceSpy = jasmine.createSpyObj('CopilotService', ['chat', 'getConversations']);
    copilotServiceSpy.getConversations.and.returnValue(of([]));
    copilotServiceSpy.chat.and.returnValue(of(responseWithEvidence));

    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideRouter([]),
        { provide: CopilotService, useValue: copilotServiceSpy },
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the assistant answer with evidence cards', () => {
    fixture.detectChanges();
    component.sendMessage('Why is ORD-1001 on hold?');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ORD-1001 was created, then placed on hold');

    const evidence = compiled.querySelector('.evidence');
    expect(evidence).toBeTruthy();
    expect(evidence?.textContent).toContain('Evidence');
    expect(evidence?.textContent).toContain('Order Created');
    expect(evidence?.textContent).toContain('Order Status Changed');
    expect(evidence?.textContent).toContain('ORD-1001');
    expect(evidence?.textContent).toContain('2 event(s)');
  });

  it('should link the evidence section to the feed page', () => {
    fixture.detectChanges();
    component.sendMessage('Why is ORD-1001 on hold?');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="/feed"]')).toBeTruthy();
  });

  it('should not render evidence when the answer has none', () => {
    copilotServiceSpy.chat.and.returnValue(of({ response: 'Plain answer.', conversationId: 'conv-1' }));
    fixture.detectChanges();
    component.sendMessage('Hello');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.evidence')).toBeNull();
    expect(compiled.textContent).toContain('Plain answer.');
  });

  it('should render persisted evidence when a conversation is reloaded', () => {
    const conv = {
      id: 'conv-9',
      userId: 'web-user',
      title: 'Why is ORD-1001 on hold?',
      messages: [
        { role: 'user', content: 'Why is ORD-1001 on hold?', timestamp: new Date().toISOString() },
        {
          role: 'assistant',
          content: 'ORD-1001 was placed on hold awaiting payment.',
          timestamp: new Date().toISOString(),
          evidence: responseWithEvidence.evidence
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fixture.detectChanges();
    component.loadConversation(conv);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(component.messages[1].evidence?.length).toBe(1);
    const evidence = compiled.querySelector('.evidence');
    expect(evidence).toBeTruthy();
    expect(evidence?.textContent).toContain('Order Created');
    expect(evidence?.textContent).toContain('Order Status Changed');
  });

  it('should send the message when Enter is pressed without Shift', () => {
    spyOn(component, 'sendMessage');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    component.onKeydownEnter(event);

    expect(component.sendMessage).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not send the message when Shift+Enter is pressed', () => {
    spyOn(component, 'sendMessage');
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    const preventDefaultSpy = spyOn(event, 'preventDefault');

    component.onKeydownEnter(event);

    expect(component.sendMessage).not.toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should show an error message and toast when the chat call fails', () => {
    copilotServiceSpy.chat.and.returnValue(throwError(() => new Error('boom')));
    const toastSpy = spyOn(TestBed.inject(ToastService), 'error');

    fixture.detectChanges();
    component.sendMessage('Hello');
    fixture.detectChanges();

    expect(component.messages.length).toBe(2);
    expect(component.messages[1].content).toContain('Sorry, I encountered an error');
    expect(component.loading).toBeFalse();
    expect(toastSpy).toHaveBeenCalledWith('Co-Pilot unavailable', jasmine.stringMatching(/Ollama/));
  });

  it('should start a new conversation by clearing messages and selection', () => {
    component.activeConversationId = 'conv-1';
    component.messages = [{ role: 'user', content: 'hi', timestamp: new Date() }];

    component.newConversation();

    expect(component.activeConversationId).toBeNull();
    expect(component.messages.length).toBe(0);
  });

  it('should ignore empty or whitespace-only input messages', () => {
    const chatSpy = copilotServiceSpy.chat;

    fixture.detectChanges();
    component.inputMessage = '   ';
    component.sendMessage();
    fixture.detectChanges();

    expect(chatSpy).not.toHaveBeenCalled();
    expect(component.messages.length).toBe(0);
  });

  it('should ignore messages while a request is in flight', () => {
    const pending = new Subject<ChatMessage>();
    copilotServiceSpy.chat.and.returnValue(pending);
    fixture.detectChanges();

    component.sendMessage('first');
    component.sendMessage('second');

    expect(copilotServiceSpy.chat).toHaveBeenCalledTimes(1);

    pending.next(responseWithEvidence);
    pending.complete();
    fixture.detectChanges();
  });
});
