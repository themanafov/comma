import Article from "@/components/articles/article";
import NoArticlesPlaceholder from "@/components/articles/no-articles-placeholder";
import AppShell from "@/components/layout/app-shell";
import AppHeader from "@/components/layout/header";
import NavButton from "@/components/layout/nav-button";
import { getArticlesByAuthor } from "@/lib/fetchers/articles";
import { getUserByDomain } from "@/lib/fetchers/users";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Articles",
};
interface ArticlesPageProps {
  params: Promise<{
    domain: string;
  }>;
}
export default async function ArticlesPage({ params }: ArticlesPageProps) {
  const domain = decodeURIComponent((await params).domain);
  const user = await getUserByDomain(domain);
  if (!user) {
    return notFound();
  }
  const articles = await getArticlesByAuthor(user.id);

  return (
    <AppShell>
      <AppHeader title="Articles">
        <NavButton href="/" aria-label="Subscribe newsletter">
          Subscribe
        </NavButton>
      </AppHeader>
      <div>
        {articles.map((article) => (
          <Article article={article} key={article.id} />
        ))}
        {!articles.length && <NoArticlesPlaceholder />}
      </div>
    </AppShell>
  );
}
