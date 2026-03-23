import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Blog.css";

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    image: "",
    excerpt: "",
    link: "",
    date: "",
    readTime: "",
    authorName: "",
    authorRole: ""
  });
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
const [preview, setPreview] = useState([]);
  
  const API = "http://localhost:5000/api/blogs";

  const fetchBlogs = async () => {
    const res = await axios.get(API);
    setBlogs(res.data);
  };

  const resetForm = () => {
  setForm({
    title: "",
    image: "",
    excerpt: "",
    link: "",
    date: "",
    readTime: "",
    authorName: "",
    authorRole: ""
  });
  setImages([]);
  setPreview([]);
  setEditId(null);
};

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const newBlog = {
    title: form.title,
      image: form.image,  
    excerpt: form.excerpt,
    link: form.link,
    date: form.date,
    readTime: form.readTime,
    author: {
      name: form.authorName,
      role: form.authorRole
    },
    images: images.length > 0 ? images : [form.image]
  };

  try {
    if (editId) {
      // UPDATE
      await axios.put(`${API}/update/${editId}`, newBlog);
    } else {
      // ADD
      await axios.post(`${API}/add`, newBlog);
    }

    fetchBlogs();
    resetForm();
  } catch (err) {
    console.error(err);
  }
};

const handleEdit = (blog) => {
  setEditId(blog._id);

  setForm({
    title: blog.title,
    image: blog.images?.[0] || blog.image || "",
    excerpt: blog.excerpt,
    link: blog.link,
    date: blog.date,
    readTime: blog.readTime,
    authorName: blog.author?.name || "",
    authorRole: blog.author?.role || ""
  });
};

  
  return (
    <div className="blog-page">

      <h1 className="page-title">📝 Blogs </h1>

      {/* FORM */}
      <div className="form-card">
        <h2>Add New Blog</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input name="title" placeholder="Blog Title" value={form.title} onChange={handleChange} required />
            <input name="image" placeholder="Image URL" value={form.image} onChange={handleChange} required />
            <input name="excerpt" placeholder="Short Description" value={form.excerpt} onChange={handleChange} required />
            <input name="link" placeholder="Read More Link" value={form.link} onChange={handleChange} />
            <input name="date" placeholder="Date (e.g. 20 Mar 2026)" value={form.date} onChange={handleChange} />
            <input name="readTime" placeholder="Read Time (e.g. 5 min)" value={form.readTime} onChange={handleChange} />
            <input name="authorName" placeholder="Author Name" value={form.authorName} onChange={handleChange} />
            <input name="authorRole" placeholder="Author Role" value={form.authorRole} onChange={handleChange} />
          </div>

          <button type="submit">
  {editId ? "✏️ Update Blog" : "➕ Add Blog"}
</button>
        </form>
      </div>

      {/* BLOG LIST */}
      <div className="blog-grid">
        {blogs.map((blog) => (
          <div className="blog-card" key={blog._id}>
            <div className="image-wrapper">
<img
  src={blog.images?.[0] || blog.image}
  alt={blog.title}
/>            </div>

            <div className="blog-content">
              <h3>{blog.title}</h3>
              <p>{blog.excerpt}</p>

              <div className="blog-meta">
                <span>{blog.date}</span>
                <span>{blog.readTime}</span>
              </div>

              <div className="author">
                <strong>{blog.author?.name}</strong>
                <span>{blog.author?.role}</span>
              </div>

              <div className="blog-actions">
                <button onClick={() => handleEdit(blog)}>✏️ Edit</button>
                </div>

              {blog.link && (
                <a href={blog.link} target="_blank" rel="noreferrer">
                  Read More →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}