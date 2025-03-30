import React from 'react';
import { NoteForm } from '../components/notes/NoteForm';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CreateNote: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-taste-light">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/app/tasting-notes')}
              className="inline-flex items-center text-taste-primary hover:text-taste-primary/80 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span>Back to Notes</span>
            </button>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6">
            <h1 className="font-serif text-5xl font-semibold text-taste-primary mb-6">Create New Note</h1>
            <NoteForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNote; 