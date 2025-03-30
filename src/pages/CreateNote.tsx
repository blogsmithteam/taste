import React from 'react';
import { NoteForm } from '../components/notes/NoteForm';

const CreateNote: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F6] to-white pt-1">
      <div className="container mx-auto px-2 max-w-4xl">
        <div className="bg-white rounded shadow-sm p-2">
          <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-4">Create New Note</h2>
          <NoteForm />
        </div>
      </div>
    </div>
  );
};

export default CreateNote; 