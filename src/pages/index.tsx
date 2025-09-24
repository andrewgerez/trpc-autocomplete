import Autocomplete from "~/components/autocomplete";

export default function Home() {
  return (
    <main style={{ background: "#f8f8ff", minHeight: "100vh", padding: "0" }}>
      <h1
        style={{
          textAlign: "center",
          fontWeight: 700,
          color: "#6c63ff",
          paddingTop: "38px",
          letterSpacing: "0.01em",
          fontSize: "2.4em",
        }}
      >
        City Finder
      </h1>
      <Autocomplete />
    </main>
  );
}
