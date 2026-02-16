import React from 'react';
import { Users, BookOpen, FileText, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

export default function DataTab({ students, courses, transcripts, onClearAll }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Students</h3>
          <Users className="text-indigo-600" size={24} />
        </div>
        <div className="text-3xl font-bold text-indigo-600">{students.length}</div>
        <div className="text-sm text-gray-600 mt-2">Total registered students</div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Courses</h3>
          <BookOpen className="text-green-600" size={24} />
        </div>
        <div className="text-3xl font-bold text-green-600">{courses.length}</div>
        <div className="text-sm text-gray-600 mt-2">Available courses</div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Grades</h3>
          <FileText className="text-purple-600" size={24} />
        </div>
        <div className="text-3xl font-bold text-purple-600">{transcripts.length}</div>
        <div className="text-sm text-gray-600 mt-2">Transcript records</div>
      </div>

      <div className="md:col-span-3 bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-bold text-lg mb-4">Data Management</h3>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">Export Data</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const csv = Papa.unparse(students);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'students.csv';
                a.click();
              }}
              className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Export Students CSV
            </button>
            <button
              onClick={() => {
                const csv = Papa.unparse(courses);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'courses.csv';
                a.click();
              }}
              className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export Courses CSV
            </button>
            <button
              onClick={() => {
                const csv = Papa.unparse(transcripts);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transcripts.csv';
                a.click();
              }}
              className="py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Export Transcripts CSV
            </button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-700 mb-3">Danger Zone</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">Clear All Data</p>
                <p className="text-xs text-red-600 mt-1">
                  This will permanently delete all students, courses, and grades. Export your data first!
                </p>
              </div>
              <button
                onClick={onClearAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> All data is stored locally in your browser.
            Manually added data will persist across sessions. Export regularly to backup your data.
          </p>
        </div>
      </div>
    </div>
  );
}
