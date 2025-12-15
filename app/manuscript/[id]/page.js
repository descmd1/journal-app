'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

export default function ManuscriptPage() {
  const { id } = useParams();

  const [manuscript, setManuscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchManuscript = async () => {
      try {
        const token = localStorage.getItem('token'); // adjust if you store it differently

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/manuscripts/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setManuscript(res.data.manuscript);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || 'Failed to load manuscript'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchManuscript();
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading manuscript...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!manuscript) {
    return <div className="p-6">Manuscript not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">
        {manuscript.title}
      </h1>

      <p className="text-gray-600 mb-4">
        Status: <span className="font-medium">{manuscript.status}</span>
      </p>

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-1">Abstract</h2>
        <p className="text-gray-700">{manuscript.abstract}</p>
      </div>

      {manuscript.keywords?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-1">Keywords</h2>
          <ul className="flex flex-wrap gap-2">
            {manuscript.keywords.map((kw, i) => (
              <li
                key={i}
                className="px-3 py-1 bg-gray-100 rounded text-sm"
              >
                {kw}
              </li>
            ))}
          </ul>
        </div>
      )}

      {manuscript.files?.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-2">Files</h2>
          <ul className="space-y-2">
            {manuscript.files.map((file, i) => (
              <li key={i}>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/${file.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  {file.originalName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
