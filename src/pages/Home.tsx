import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/useAuthStore';
import { useContactsStore } from '../store/useContactsStore';
import { useChatStore } from '../store/useChatStore';
import { contactService } from '../services/contactService';
import { groupService } from '../services/groupService';
import { Group, User } from '../types';
import AddContactModal from '../components/AddContactModal';
import Avatar from '../components/Avatar';
import StatusDot from '../components/StatusDot';
import ChatScreen from '../components/ChatScreen';

interface HomeProps {
  tab: 'chats' | 'contacts' | 'groups';
}

export default function Home({ tab }: HomeProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const contacts = useContactsStore((state) => state.contacts);
  const addContact = useContactsStore((state) => state.addContact);
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const [showAddContact, setShowAddContact] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatRecipient, setActiveChatRecipient] = useState<string>('');

  useSocket();

  // Update page title based on tab
  useEffect(() => {
    const titles: Record<string, string> = {
      chats: 'Chats — VoxLink',
      contacts: 'Contacts — VoxLink',
      groups: 'Rooms — VoxLink'
    };
    document.title = titles[tab] ?? 'VoxLink';
  }, [tab]);

  const contactsQuery = useQuery<User[]>({
    queryKey: ['contacts'],
    queryFn: () => contactService.getContacts(),
    enabled: Boolean(currentUser)
  });

  useEffect(() => {
    if (contactsQuery.data) {
      contactsQuery.data.forEach(addContact);
    }
  }, [contactsQuery.data, addContact]);

  const groupsQuery = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: () => groupService.getGroups(),
    enabled: Boolean(currentUser)
  });

  useEffect(() => {
    if (groupsQuery.data) {
      setGroups(groupsQuery.data);
    }
  }, [groupsQuery.data]);

  const conversations = useMemo(
    () => Object.entries(messages).map(([chatId, thread]) => ({ chatId, thread })),
    [messages]
  );

  // Filter contacts and groups by search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) => c.username.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.chatId.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  function openChat(contact: User) {
    setActiveChatId(contact.id);
    setActiveChatRecipient(contact.username);
  }

  const tabLabel = tab === 'chats' ? 'Chats' : tab === 'contacts' ? 'Contacts' : 'Rooms';
  const isLoading = contactsQuery.isLoading || groupsQuery.isLoading;

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-background px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="VoxLink Logo" className="h-10 w-10 rounded-lg shadow-sm bg-black" />
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
            placeholder="Search chats or contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            {/* Active Chat View */}
            {activeChatId ? (
              <div>
                <button
                  onClick={() => setActiveChatId(null)}
                  className="mb-4 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary hover:bg-background"
                >
                  ← Back to chats
                </button>
                <ChatScreen
                  chatId={activeChatId}
                  messages={messages[activeChatId] ?? []}
                  recipientName={activeChatRecipient}
                  onSend={(msg) => addMessage(msg)}
                />
              </div>
            ) : (
              <>
                {/* Recent Chats */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text">Recent chats</h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">
                      {filteredConversations.length} chats
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {filteredConversations.length ? (
                      filteredConversations.map((conversation) => (
                        <button
                          key={conversation.chatId}
                          onClick={() => {
                            setActiveChatId(conversation.chatId);
                            setActiveChatRecipient(conversation.chatId);
                          }}
                          className="w-full rounded-2xl border border-border bg-surface p-4 text-left transition hover:bg-background"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-semibold text-text">{conversation.chatId}</p>
                            <span className="text-xs text-text-secondary">
                              {conversation.thread.length} msgs
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                            {conversation.thread[conversation.thread.length - 1]?.text ??
                              'No messages yet'}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
                        No chats yet. Start a conversation by clicking a contact below.
                      </div>
                    )}
                  </div>
                </div>

                {/* Online Contacts */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text">Online contacts</h2>
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-text hover:bg-surface"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {filteredContacts.length ? (
                      filteredContacts.slice(0, 4).map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => openChat(contact)}
                          className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4 text-left transition hover:bg-background"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar username={contact.username} avatar={contact.avatar} size={32} />
                            <div>
                              <p className="text-base font-semibold text-text">{contact.username}</p>
                              <p className="text-sm text-text-secondary">{contact.status}</p>
                            </div>
                          </div>
                          <StatusDot status={contact.status} />
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
                        No online contacts yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        ) : tab === 'contacts' ? (
          <section className="space-y-4">
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
                    onClick={() => openChat(contact)}
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
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text">Rooms</h2>
            <div className="space-y-3">
              {filteredGroups.length ? (
                filteredGroups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-border bg-surface px-4 py-4">
                    <p className="text-base font-medium text-text">{group.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">{group.members.length} members</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
                  {searchQuery ? 'No rooms match your search.' : 'No rooms created yet.'}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Add Contact Modal */}
      {showAddContact ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-4 sm:items-center">
          <AddContactModal onClose={() => setShowAddContact(false)} />
        </div>
      ) : null}

      {/* FAB - only show when not in an active chat */}
      {!activeChatId ? (
        <button
          type="button"
          className="fixed bottom-24 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-text shadow-lg transition hover:scale-105"
          onClick={() => setShowAddContact(true)}
        >
          +
        </button>
      ) : null}
    </div>
  );
}
