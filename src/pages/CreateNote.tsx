import React from 'react';
import { CreateNoteForm } from '../components/notes/CreateNoteForm';

const CreateNote: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Note</h1>
        <CreateNoteForm />
      </div>
    </div>
  );
};

export default CreateNote; 