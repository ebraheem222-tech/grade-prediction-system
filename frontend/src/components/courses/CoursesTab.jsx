import React, { useState } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';

export default function CoursesTab({ courses, onCsvUpload, onAddCourse, onDeleteCourse }) {
  const [newCourse, setNewCourse] = useState({
    courseId: '', code: '', name: '', credits: '', type: '', department: '', level: '', difficulty: ''
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <BookOpen className="text-indigo-600" />
        Manage Courses
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Courses CSV
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
          placeholder="Course ID*"
          value={newCourse.courseId}
          onChange={(e) => setNewCourse({...newCourse, courseId: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Course Code*"
          value={newCourse.code}
          onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Course Name*"
          value={newCourse.name}
          onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          placeholder="Credits"
          value={newCourse.credits}
          onChange={(e) => setNewCourse({...newCourse, credits: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={newCourse.type}
          onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Type</option>
          <option value="Core">Core</option>
          <option value="Elective">Elective</option>
          <option value="Lab">Lab</option>
        </select>
        <input
          type="text"
          placeholder="Department"
          value={newCourse.department}
          onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={newCourse.level}
          onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Level</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Graduate">Graduate</option>
        </select>
        <input
          type="number"
          step="0.1"
          min="1"
          max="10"
          placeholder="Difficulty (1-10)"
          value={newCourse.difficulty}
          onChange={(e) => setNewCourse({...newCourse, difficulty: e.target.value})}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={() => {
          onAddCourse(newCourse);
          setNewCourse({ courseId: '', code: '', name: '', credits: '', type: '', department: '', level: '', difficulty: '' });
        }}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Add Course
      </button>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Courses ({courses.length})</h3>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Credits</th>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 50).map((course, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{course.courseId}</td>
                  <td className="px-3 py-2 font-semibold">{course.code}</td>
                  <td className="px-3 py-2">{course.name}</td>
                  <td className="px-3 py-2">{course.credits}</td>
                  <td className="px-3 py-2">{course.department}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onDeleteCourse(course.courseId)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length > 50 && (
            <div className="text-center text-gray-500 py-2">
              ... and {courses.length - 50} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
