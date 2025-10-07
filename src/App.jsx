import { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Basic fetch request to API end point - replace this for required endpoint */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://ksip4rkha0.execute-api.eu-west-2.amazonaws.com/items');
        if (!response.ok) throw new Error('Failed to fetch');
        let result = await response.json();
        result = JSON.stringify(result, null, 2)

        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>User List</h1>
      <pre>{data}</pre>
    </div>
  );
}

export default App;