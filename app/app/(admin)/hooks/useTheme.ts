import { useEffect, useState } from "react";

const useTheme = (): [
  string,
  (event: React.MouseEvent<HTMLElement>) => void,
] => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storeTheme = window.localStorage.getItem("theme");
    if (storeTheme) setTheme(storeTheme);
  }, []);
  useEffect(() => {
    const adminLayout = document.getElementById("admin-layout");
    if (adminLayout) {
      adminLayout.classList.toggle("dark", theme === "dark");
    }
  }, [theme]); // 当 value 变化时重新执行该 effect

  const toggleTheme = (event: React.MouseEvent<HTMLElement>) => {
    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      // const root = document.documentElement;

      setTheme((prevTheme) => {
        const value = prevTheme === "light" ? "dark" : "light";
        // root.classList.toggle('dark', value === 'dark')
        // const adminLayout = document.getElementById("admin-layout");
        // adminLayout?.classList.toggle('dark', value === 'dark')
        // adminLayout?.classList.remove(prevTheme)
        // adminLayout?.classList.add(value)
        window.localStorage.setItem("theme", value);
        return value;
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: theme === "dark" ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: "ease-in",
          pseudoElement:
            theme === "dark"
              ? "::view-transition-old(root)"
              : "::view-transition-new(root)",
        },
      );
    });
  };

  return [theme, toggleTheme];
};

export default useTheme;
