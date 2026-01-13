"use client"
import { useLoginController } from "./controller/useLoginController";

export default function LoginPage() {
   const { email, isValid, handleEmailChange , password,isPasswordValid ,handlePasswordChange,handleLogin,error,isLoading} = useLoginController();
   const canLogin = isValid && isPasswordValid;
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-gray-300 rounded-xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center mb-6">
          Dashboard Login
        </h1>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border`}
          />
        
          <input
            type="password"
             value={password}
            placeholder="Password"
            onChange={(e) => handlePasswordChange(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border`}
          />

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

         <button
          type="button"
          onClick={(e) => handleLogin(e)}
          disabled={!canLogin || isLoading}
          className={`w-full py-2 rounded-lg text-white mt-4 ${
           isLoading ? "bg-black": canLogin  ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Loading..." : "Login"}
        </button>

        </form>

      </div>
    </div>
  );
}
