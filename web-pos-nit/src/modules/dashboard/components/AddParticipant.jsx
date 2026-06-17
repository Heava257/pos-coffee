// src/components/AddParticipant.js
import React, { useState } from 'react';
import { addParticipant } from '@/component/services/api';
import UserSearch from '@/modules/dashboard/components/UserSearch';
// import UserSearch from '@/component/UserSearch';

const AddParticipant = ({ conversationId }) => {
  const [participantId, setParticipantId] = useState('');

  const handleAddParticipant = async () => {
    await addParticipant(conversationId, participantId);
    setParticipantId('');
  };

  return (
    <div>
      <h2>Add Participant</h2>
      <UserSearch onAddUser={setParticipantId} />
      <button onClick={handleAddParticipant}>Add</button>
    </div>
  );
};

export default AddParticipant;