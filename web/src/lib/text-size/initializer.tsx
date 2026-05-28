// ページレンダリング前に html クラスを設定して FOUC を防ぐ
export function TextSizeInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{if(localStorage.getItem('text-size-large')==='true'){document.documentElement.classList.add('large-text');}}catch(e){}})();`,
      }}
    />
  );
}
