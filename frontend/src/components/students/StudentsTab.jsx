import React, { useState } from 'react';
import { Users, Trash2 } from 'lucide-react';

export default function StudentsTab({ students, onCsvUpload, onAddStudent, onDeleteStudent }) {
  const [newStudent, setNewStudent] = useState({
    studentId: '', firstName: '', lastName: '', email: '', program: '', startYear: ''
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Users className="text-indigo-600" />
        Manage Students
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Students CSV
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
          value={newStudent.studentId}
          onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="First Name*"
          value={newStudent.firstName}
          onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Last Name*"
          value={newStudent.lastName}
          onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={newStudent.email}
          onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Program"
          value={newStudent.program}
          onChange={(e) => setNewStudent({...newStudent, program: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          placeholder="Start Year"
          value={newStudent.startYear}
          onChange={(e) => setNewStudent({...newStudent, startYear: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={() => {
          onAddStudent(newStudent);
          setNewStudent({ studentId: '', firstName: '', lastName: '', email: '', program: '', startYear: '' });
        }}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Add Student
      </button>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Students ({students.length})</h3>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Program</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 50).map((s, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{s.studentId}</td>
                  <td className="px-3 py-2">{s.firstName} {s.lastName}</td>
                  <td className="px-3 py-2">{s.email}</td>
                  <td className="px-3 py-2">{s.program}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onDeleteStudent(s.studentId)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete student"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length > 50 && (
            <div className="text-center text-gray-500 py-2">
              ... and {students.length - 50} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
