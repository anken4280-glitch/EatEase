// Simple upload component
function ImageUpload({ type, onUpload }) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`/api/restaurant/upload/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      onUpload(data.url);
    }
  };
  
  return <input type="file" accept="image/*" onChange={handleFileChange} />;
}