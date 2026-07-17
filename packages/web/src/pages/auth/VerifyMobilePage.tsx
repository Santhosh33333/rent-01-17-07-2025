export function VerifyMobilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your mobile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the OTP sent to your mobile number to verify your account.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            className="input rounded-md text-center text-2xl tracking-widest"
            maxLength={6}
          />
          <button className="btn-primary w-full">Verify</button>
        </div>
      </div>
    </div>
  )
}
