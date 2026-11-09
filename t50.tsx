export function F({loadingList, banners}: any) { return (
 <section>
          {loadingList ? <p>wait</p> : banners.length === 0 ? <p>empty</p> : <div>
            {banners.map((it) => <article key={it._id}><img src={it.imageUrl} /><p>{it.title}</p></article>)}
            </div>}
 </section>
 ); }
