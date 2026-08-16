import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ChatComponent } from './chat.component';
import { CopilotService, ChatMessage } from '../../services/copilot.service';

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
        { provide: CopilotService, useValue: copilotServiceSpy }
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
});
