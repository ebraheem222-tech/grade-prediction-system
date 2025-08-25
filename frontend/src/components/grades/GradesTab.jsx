import React, { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';

export default function GradesTab({ transcripts, courses, onCsvUpload, onAddGrade, onDeleteGrade }) {
  const [newGrade, setNewGrade] = useState({
    studentId: '', courseId: '', courseCode: '', grade: '', term: '', year: '', attemptNo: '1'
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="text-indigo-600" />
        Manage Grades
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Transcripts CSV
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files[0] && onCsvUpload(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Student ID*"
          value={newGrade.studentId}
          onChange={(e) => setNewGrade({...newGrade, studentId: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Course ID or Code*"
          value={newGrade.courseId || newGrade.courseCode}
          onChange={(e) => {
            const value = e.target.value;
            const course = courses.find(c => (c.code || '').trim().toUpperCase() === value.trim().toUpperCase());
            if (course) setNewGrade({...newGrade, courseId: course.courseId, courseCode: course.code});
            else setNewGrade({...newGrade, courseId: value, courseCode: value});
          }}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          min="0"
          max="100"
          placeholder="Grade (0-100)*"
          value={newGrade.grade}
          onChange={(e) => setNewGrade({...newGrade, grade: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={newGrade.term}
          onChange={(e) => setNewGrade({...newGrade, term: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Term</option>
          <option value="Winter">Winter</option>
          <option value="Spring">Spring</option>
          <option value="Summer">Summer</option>
          <option value="Fall">Fall</option>
        </select>
        <input
          type="number"
          placeholder="Year"
          value={newGrade.year}
          onChange={(e) => setNewGrade({...newGrade, year: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          min="1"
          placeholder="Attempt #"
          value={newGrade.attemptNo}
          onChange={(e) => setNewGrade({...newGrade, attemptNo: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={() => {
          onAddGrade(newGrade);
          setNewGrade({ studentId: '', courseId: '', courseCode: '', grade: '', term: '', year: '', attemptNo: '1' });
        }}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Add Grade
      </button>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Transcript Records ({transcripts.length})</h3>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Course</th>
                <th className="px-3 py-2 text-left">Grade</th>
                <th className="px-3 py-2 text-left">Term</th>
                <th className="px-3 py-2 text-left">Year</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transcripts.slice(0, 50).map((g, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{g.studentId}</td>
                  <td className="px-3 py-2">{g.courseId || g.courseCode}</td>
                  <td className="px-3 py-2">{g.grade}%</td>
                  <td className="px-3 py-2">{g.term}</td>
                  <td className="px-3 py-2">{g.year}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onDeleteGrade(i)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete grade"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transcripts.length > 50 && (
            <div className="text-center text-gray-500 py-2">
              ... and {transcripts.length - 50} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
