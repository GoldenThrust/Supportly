export default function Signup() {
  return (
    <div className="bg-slate-50 w-1/2 text-slate-800 rounded-2xl flex flex-col items-center justify-center p-8">
      <h1 className="font-extrabold text-2xl pb-2 text-indigo-700 " style={{
        fontFamily: "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
        fontVariantCaps: "small-caps",
      }}>Supportly</h1>
      <p className="text-sm text-center mb-4">
        Support call scheduling made easy. Simplify your support ticket and make
        your clients happy with <b>Supportly</b>. Get Started now.
      </p>
      <form className="flex flex-col space-y-4 w-full max-w-11/12">
        <input
          type="text"
          placeholder="Username"
          className="p-2 rounded-2xl border border-gray-300"
        />
        <input
          type="email"
          placeholder="Email"
          className="p-2 rounded-2xl border border-gray-300"
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 rounded-2xl border border-gray-300"
        />
        <button type="submit" className="bg-cyan-900 text-white p-2 rounded-2xl">
          Sign Up
        </button>
      </form>
    </div>
  );
}
