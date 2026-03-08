import React, { useState, useEffect } from 'react';
import { Users, Phone, Trash2, Plus, Loader2 } from 'lucide-react';

export default function FamilyContacts({ userId }: { userId: string }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchContacts();
  }, [userId]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/contacts/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (e) {
      console.error("Failed to fetch contacts", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !relation || !phoneNumber) return;
    
    setIsAdding(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, relation, phoneNumber })
      });
      
      if (res.ok) {
        const newContact = await res.json();
        setContacts([newContact, ...contacts]);
        setName('');
        setRelation('');
        setPhoneNumber('');
      }
    } catch (e) {
      console.error("Failed to add contact", e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts(contacts.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete contact", e);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-500" />
        Family Emergency Contacts
      </h2>
      
      <form onSubmit={handleAddContact} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Relation (e.g. Father)"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="tel"
            placeholder="Phone (e.g. +1234567890)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isAdding}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Save Contact
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No family contacts added yet. Add them above to notify them during an emergency.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <span className="font-bold text-sm">{contact.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800 text-sm">{contact.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="bg-gray-200 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-600">{contact.relation}</span>
                    <Phone className="w-3 h-3 ml-1" /> {contact.phoneNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(contact.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
