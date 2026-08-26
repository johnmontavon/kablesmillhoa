import { Link } from "react-router-dom";
import posts from "../data/posts.json";
import Layout from "../components/Layout";

export default function PostsPage() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Announcements & Updates</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <div
            key={post.slug}
            className="border p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <Link to={`/posts/${post.slug}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-gray-500 text-sm">{post.date}</p>
              <p>{post.summary}</p>
            </Link>
          </div>
        ))}
      </div>
    </Layout>
  );
}
