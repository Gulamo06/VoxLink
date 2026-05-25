import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AddContactModal from '../components/AddContactModal';
import Avatar from '../components/Avatar';
import ChatScreen from '../components/ChatScreen';
import CreateRoomModal from '../components/CreateRoomModal';
import StatusDot from '../components/StatusDot';
import { useSocket } from '../hooks/useSocket';
import { contactService } from '../services/contactService';
import { groupService } from '../services/groupService';
import { messageService } from '../services/messageService';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useContactsStore } from '../store/useContactsStore';
import { Group, User } from '../types';
import { createDirectChatId } from '../utils/chat';

interface HomeProps {
  tab: 'chats' | 'contacts' | 'groups';
}

interface ActiveThread {
  id: string;
  kind: 'direct' | 'group';
  name: string;
}

function getPreviewText(text?: string, voiceUrl?: string) {
  if (text?.trim()) {
    return text;
  }

  if (voiceUrl) {
    return 'Voice message';
  }

  return 'Start a conversation';
}

export default function Home({ tab }: HomeProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const contacts = useContactsStore((state) => state.contacts);
  const setContacts = useContactsStore((state) => state.setContacts);
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null);

  useSocket();

  useEffect(() => {
    const titles: Record<HomeProps['tab'], string> = {
      chats: 'Chats - VoxLink',
      contacts: 'Contacts - VoxLink',
      groups: 'Rooms - VoxLink'
    };

    document.title = titles[tab];
  }, [tab]);

  const contactsQuery = useQuery<User[]>({
    queryKey: ['contacts', currentUser?.id],
    queryFn: () => contactService.getContacts(),
    enabled: Boolean(currentUser)
  });

  useEffect(() => {
    if (contactsQuery.data) {
      setContacts(contactsQuery.data);
    }
  }, [contactsQuery.data, setContacts]);

  const groupsQuery = useQuery<Group[]>({
    queryKey: ['groups', currentUser?.id],
    queryFn: () => groupService.getGroups(),
    enabled: Boolean(currentUser)
  });

  useEffect(() => {
    if (groupsQuery.data) {
      setGroups(groupsQuery.data);
    }
  }, [groupsQuery.data]);

  useEffect(() => {
    if (!activeThread) {
      return;
    }

    let cancelled = false;

    messageService
      .fetchMessages(activeThread.id)
      .then((threadMessages) => {
        if (!cancelled) {
          setMessages(activeThread.id, threadMessages);
        }
      })
      .catch((error) => {
        console.error('Load messages error:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeThread, setMessages]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }

    const query = searchQuery.toLowerCase();
    return contacts.filter((contact) => contact.username.toLowerCase().includes(query));
  }, [contacts, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups;
    }

    const query = searchQuery.toLowerCase();
    return groups.filter((group) => group.name.toLowerCase().includes(query));
  }, [groups, searchQuery]);

  const directChatCards = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return filteredContacts
      .map((contact) => {
        const chatId = createDirectChatId(currentUser.id, contact.id);
        const thread = messages[chatId] ?? [];
        const latestMessage = thread[0];

        return {
          chatId,
          contact,
          latestMessage
        };
      })
      .sort((left, right) => {
        const leftTime = left.latestMessage ? new Date(left.latestMessage.createdAt).getTime() : 0;
        const rightTime = right.latestMessage ? new Date(right.latestMessage.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });
  }, [currentUser, filteredContacts, messages]);

  const roomCards = useMemo(() => {
    return filteredGroups
      .map((group) => ({
        group,
        latestMessage: (messages[group.id] ?? [])[0]
      }))
      .sort((left, right) => {
        const leftTime = left.latestMessage ? new Date(left.latestMessage.createdAt).getTime() : 0;
        const rightTime = right.latestMessage ? new Date(right.latestMessage.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });
  }, [filteredGroups, messages]);

  const activeMessages = activeThread ? messages[activeThread.id] ?? [] : [];
  const isDirectThreadOpen = activeThread?.kind === 'direct' && (tab === 'chats' || tab === 'contacts');
  const isGroupThreadOpen = activeThread?.kind === 'group' && tab === 'groups';

  function openDirectChat(contact: User) {
    if (!currentUser) {
      return;
    }

    setActiveThread({
      id: createDirectChatId(currentUser.id, contact.id),
      kind: 'direct',
      name: contact.username
    });
  }

  function openGroupChat(group: Group) {
    setActiveThread({
      id: group.id,
      kind: 'group',
      name: group.name
    });
  }

  function closeActiveThread() {
    setActiveThread(null);
  }

  function handleRoomCreated(group: Group) {
    setGroups((currentGroups) => [group, ...currentGroups.filter((entry) => entry.id !== group.id)]);
    openGroupChat(group);
  }

  const tabLabel = tab === 'chats' ? 'Chats' : tab === 'contacts' ? 'Contacts' : 'Rooms';
  const searchPlaceholder =
    tab === 'groups' ? 'Search rooms' : tab === 'contacts' ? 'Search contacts' : 'Search chats or contacts';
  const isLoading = contactsQuery.isLoading || groupsQuery.isLoading;

  return (
    <div>
      <div className="border-b border-border bg-background px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="VoxLink Logo" className="h-10 w-10 rounded-lg bg-black shadow-sm" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-text-secondary">VoxLink</p>
              <h1 className="mt-1 text-2xl font-semibold text-text">{tabLabel}</h1>
            </div>
          </div>
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Avatar username={currentUser.username} avatar={currentUser.avatar} size={36} />
              <div>
                <p className="text-sm font-medium text-text">{currentUser.username}</p>
                <StatusDot status={currentUser.status} />
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-4">
          <input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-text placeholder:text-text-secondary focus:outline-none"
          />
        </div>
      </div>

      <main className="space-y-5 px-5 pt-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : tab === 'chats' ? (
          <section className="space-y-5">
            {isDirectThreadOpen && activeThread ? (
              <div>
                <button
                  onClick={closeActiveThread}
                  className="mb-4 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary hover:bg-background"
                >
                  Back to chats
                </button>
                <ChatScreen
                  chatId={activeThread.id}
                  messages={activeMessages}
                  recipientName={activeThread.name}
                  onSend={addMessage}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text">Your chats</h2>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {directChatCards.length ? (
                    directChatCards.map(({ chatId, contact, latestMessage }) => (
                      <button
                        key={chatId}
                        onClick={() => openDirectChat(contact)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4 text-left transition hover:bg-background"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar username={contact.username} avatar={contact.avatar} size={40} />
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-text">{contact.username}</p>
                            <p className="mt-1 truncate text-sm text-text-secondary">
                              {getPreviewText(latestMessage?.text, latestMessage?.voiceUrl)}
                            </p>
                          </div>
                        </div>
                        <StatusDot status={contact.status} />
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
                      No chats yet. Add a contact to start messaging.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        ) : tab === 'contacts' ? (
          <section className="space-y-4">
            {isDirectThreadOpen && activeThread ? (
              <div>
                <button
                  onClick={closeActiveThread}
                  className="mb-4 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary hover:bg-background"
                >
                  Back to contacts
                </button>
                <ChatScreen
                  chatId={activeThread.id}
                  messages={activeMessages}
                  recipientName={activeThread.name}
                  onSend={addMessage}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text">Contacts</h2>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {filteredContacts.length ? (
                    filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => openDirectChat(contact)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4 text-left transition hover:bg-background"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar username={contact.username} avatar={contact.avatar} size={32} />
                          <div>
                            <p className="text-base font-medium text-text">{contact.username}</p>
                            <p className="mt-1 text-sm text-text-secondary">{contact.status}</p>
                          </div>
                        </div>
                        <StatusDot status={contact.status} />
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
                      {searchQuery ? 'No contacts match your search.' : 'Add someone to start messaging.'}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            {isGroupThreadOpen && activeThread ? (
              <div>
                <button
                  onClick={closeActiveThread}
                  className="mb-4 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary hover:bg-background"
                >
                  Back to rooms
                </button>
                <ChatScreen
                  chatId={activeThread.id}
                  messages={activeMessages}
                  recipientName={activeThread.name}
                  onSend={addMessage}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text">Rooms</h2>
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {roomCards.length ? (
                    roomCards.map(({ group, latestMessage }) => (
                      <button
                        key={group.id}
                        onClick={() => openGroupChat(group)}
                        className="w-full rounded-2xl border border-border bg-surface px-4 py-4 text-left transition hover:bg-background"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-medium text-text">{group.name}</p>
                          <span className="text-xs text-text-secondary">
                            {group.members.length} member{group.members.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary">
                          {getPreviewText(latestMessage?.text, latestMessage?.voiceUrl)}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
                      {searchQuery ? 'No rooms match your search.' : 'Create a room to start a shared chat.'}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {showAddContact ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 sm:items-center">
          <AddContactModal onClose={() => setShowAddContact(false)} />
        </div>
      ) : null}

      {showCreateRoom ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 sm:items-center">
          <CreateRoomModal onClose={() => setShowCreateRoom(false)} onCreated={handleRoomCreated} />
        </div>
      ) : null}

      {!activeThread ? (
        <button
          type="button"
          className="fixed bottom-24 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-text shadow-lg transition hover:scale-105"
          onClick={() => (tab === 'groups' ? setShowCreateRoom(true) : setShowAddContact(true))}
        >
          +
        </button>
      ) : null}
    </div>
  );
}
