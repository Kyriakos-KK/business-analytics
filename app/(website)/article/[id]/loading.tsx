export default function ArticleLoading() {
  return (
    <>
      <div className="page-hero" />
      <main className="page-wrap" style={{ marginTop: 28 }}>
        <div className="content-grid">
          <section>
            <div className="article-full glass" style={{ padding: '28px 28px 32px', borderRadius: 18 }}>
              <div className="skel skel-img" />
              <div className="skel skel-badge" />
              <div className="skel skel-h1" />
              <div className="skel skel-line" />
              <div className="skel skel-line" />
              <div className="skel skel-line skel-short" />
              <div className="skel skel-line" />
              <div className="skel skel-line skel-short" />
            </div>
          </section>
          <aside className="sidebar" />
        </div>
      </main>
    </>
  )
}