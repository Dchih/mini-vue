export function shouldUpdateComponent(prev, next) {
  const { props: prevProps } = prev;
  const { props: nextProps } = next;

  for (let key in nextProps) {
    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }
  return false;
}
