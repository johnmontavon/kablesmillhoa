import { useParams } from "react-router-dom";
import posts from "../data/posts.json";
import Layout from "../components/Layout";

export default function PostPage() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <Layout>
        <p className="text-red-500">Post not found.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-500 mb-6">{post.date}</p>
      <div className="prose max-w-none">
        {post.content.split("\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Layout>
  );
}
