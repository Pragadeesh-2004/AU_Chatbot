"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const roleOptions = [
	{ value: "student", label: "Student", idLabel: "Roll No" },
	{ value: "faculty", label: "Faculty", idLabel: "Faculty ID" },
	{ value: "official", label: "Official", idLabel: "Official ID" },
	{ value: "scholar", label: "Scholar", idLabel: "Scholar ID" },
	{ value: "admin", label: "Admin", idLabel: "Admin ID" },
];

// Card moved outside to avoid remount
const Card: React.FC<{ children: React.ReactNode; onBack?: () => void }> = ({ children, onBack }) => (
	<div className="bg-white/95 rounded-xl shadow-lg p-8 max-w-md w-full mx-auto relative animate-fade-in">
		{onBack && (
			<button
				type="button"
				className="absolute left-4 top-4 text-blue-700 hover:text-blue-900"
				onClick={onBack}
				aria-label="Back"
			>
				<ArrowLeft size={28} />
			</button>
		)}
		{children}
	</div>
);

// Forward ref wrapper for Input
const FocusableInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
	(props, ref) => <Input ref={ref} {...props} />
);
FocusableInput.displayName = "FocusableInput";

type ForgotPasswordPageProps = {
	showDialog?: (type: "error" | "success", message: string) => void;
	onBack?: () => void;
	initialRole?: string;
	initialId?: string;
};

export default function ForgotPasswordPage({
	showDialog,
	onBack,
	initialRole = "student",
	initialId = "",
}: ForgotPasswordPageProps) {
	const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
	const [role, setRole] = useState(initialRole);
	const [id, setId] = useState(initialId);
	const [code, setCode] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [inputError, setInputError] = useState<string | null>(null);
	const [codeError, setCodeError] = useState<string | null>(null);
	const [resendCount, setResendCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [info, setInfo] = useState<string | null>(null);

	const idInputRef = useRef<HTMLInputElement>(null);
	const codeInputRef = useRef<HTMLInputElement>(null);
	const passwordInputRef = useRef<HTMLInputElement>(null);
	const confirmInputRef = useRef<HTMLInputElement>(null);

	// Memoized current role
	const currentRole = useMemo(() => roleOptions.find((r) => r.value === role), [role]);

	// Focus inputs based on step
	useEffect(() => {
		if (step === 1) idInputRef.current?.focus();
		else if (step === 2) codeInputRef.current?.focus();
		else if (step === 3) passwordInputRef.current?.focus();
	}, [step, role]);

	// Reset all fields on mount
	useEffect(() => {
		setRole(initialRole);
		setId(initialId);
		setCode("");
		setPassword("");
		setConfirm("");
		setInputError(null);
		setCodeError(null);
		setResendCount(0);
		setIsLoading(false);
		setShowPassword(false);
		setShowConfirm(false);
		setInfo(null);
	}, []);

	// --- Step 1: Send Code ---
	const handleSendCode = async () => {
		setInputError(null);
		setIsLoading(true);
		try {
			const res = await fetch(`${API_BASE}/authentication/forgot-password/send-code`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role, id }),
			});
			const data = await res.json();
			if (!res.ok) {
				let errorMessage = "Something went wrong. Please try again.";
				if (data && data.message) {
					if (typeof data.message === "string") {
						errorMessage = data.message;
					} else if (typeof data.message === "object") {
						errorMessage = JSON.stringify(data.message.message);
					} else {
						errorMessage = String(data.message);
					}
				} else if (data && data.error && typeof data.error === "string" && data.error !== "Bad Request") {
					errorMessage = data.error;
				}
				setInputError(errorMessage);
				return;
			}
			setResendCount(1);
			setInfo("Reset code sent to your registered email.");
			setStep(2);
		} catch (e: any) {
			setInputError(e?.message || "Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	// --- Step 2: Verify Code ---
	const handleVerifyCode = async () => {
		setCodeError(null);
		setIsLoading(true);
		try {
			const res = await fetch(`${API_BASE}/authentication/forgot-password/verify-code`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role, id, code }),
			});
			const data = await res.json();
			if (!res.ok) {
				let errorMessage = "Something went wrong. Please try again.";
				if (data && data.message) {
					if (typeof data.message === "string") {
						errorMessage = data.message;
					} else if (typeof data.message === "object") {
						errorMessage = JSON.stringify(data.message.message);
					} else {
						errorMessage = String(data.message);
					}
				} else if (data && data.error && typeof data.error === "string" && data.error !== "Bad Request") {
					errorMessage = data.error;
				}
				setInputError(errorMessage);
				return;
			}
			setStep(3);
		} catch (e: any) {
			setCodeError(e.message || "Invalid or expired code.");
		} finally {
			setIsLoading(false);
		}
	};

	// --- Step 3: Reset Password ---
	const handleResetPassword = async () => {
		setInputError(null);
		setIsLoading(true);
		if (password !== confirm) {
			setInputError("Passwords do not match.");
			setIsLoading(false);
			return;
		}
		try {
			const res = await fetch(`${API_BASE}/authentication/forgot-password/reset`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role, id, code, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				let errorMessage = "Something went wrong. Please try again.";
				if (data && data.message) {
					if (typeof data.message === "string") {
						errorMessage = data.message;
					} else if (typeof data.message === "object") {
						errorMessage = JSON.stringify(data.message.message);
					} else {
						errorMessage = String(data.message);
					}
				} else if (data && data.error && typeof data.error === "string" && data.error !== "Bad Request") {
					errorMessage = data.error;
				}
				setInputError(errorMessage);
				return;
			}
			setStep(4);
		} catch (e: any) {
			setInputError(e.message || "Failed to reset password.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendCode = async () => {
		setInputError(null);
		setIsLoading(true);
		try {
			const res = await fetch(`${API_BASE}/authentication/forgot-password/send-code`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role, id }),
			});
			const data = await res.json();
			if (!res.ok) {
				let errorMessage = "Something went wrong. Please try again.";
				if (data && data.message) {
					if (typeof data.message === "string") {
						errorMessage = data.message;
					} else if (typeof data.message === "object") {
						errorMessage = JSON.stringify(data.message.message);
					} else {
						errorMessage = String(data.message);
					}
				} else if (data && data.error && typeof data.error === "string" && data.error !== "Bad Request") {
					errorMessage = data.error;
				}
				setInputError(errorMessage);
				return;
			}
			setResendCount((prev) => prev + 1); // Increment on resend
			setInfo("Reset code resent to your registered email.");
		} catch (e: any) {
			setInputError(e.message || "Failed to resend code.");
		} finally {
			setIsLoading(false);
		}
	};

	// --- Back button ---
	const handleBack = () => {
		if (step === 1) {
			setRole(initialRole);
			setId(initialId);
			setCode("");
			setPassword("");
			setConfirm("");
			setInputError(null);
			setCodeError(null);
			setResendCount(0);
			setIsLoading(false);
			setShowPassword(false);
			setShowConfirm(false);
			setInfo(null);
			if (onBack) onBack();
		} else if (step === 2) setStep(1);
		else if (step === 3) setStep(2);
		else if (step === 4) setStep(1);
	};

	return (
		<div className="min-h-[400px] flex items-center justify-center">
			{/* Step 1 */}
			{step === 1 && (
				<Card onBack={handleBack}>
					<h2 className="text-2xl font-bold text-center mb-6 text-blue-800">Forgot Password</h2>
					<label className="block mb-2 text-blue-900 text-sm font-semibold">Role</label>
					<select
						value={role}
						onChange={(e) => {
							setRole(e.target.value);
							setId("");
							setInputError(null);
						}}
						className="w-full bg-white text-blue-900 border-blue-400 h-10 px-3 text-sm rounded-lg focus:ring-2 focus:ring-cyan-200 mb-4"
						style={{ borderWidth: "1px", borderStyle: "solid" }}
					>
						{roleOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>

					<label className="block mb-2 text-blue-900 text-sm font-semibold">
						{currentRole?.idLabel} <span className="text-xs text-blue-400">(Numbers only)</span>
					</label>
					<div className="relative">
						<FocusableInput
							ref={idInputRef}
							type="text"
							value={id}
							onChange={(e) => {
								setId(e.target.value.replace(/\D/g, ""));
								setInputError(null);
							}}
							placeholder={`Enter your ${currentRole?.idLabel}`}
							className={`bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 ${
								inputError ? "border-red-500 placeholder-red-500" : ""
							}`}
						/>
					</div>
					{inputError && <div className="text-red-500 text-xs mt-1">{inputError}</div>}
					<Button
						type="button"
						className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-sm rounded-lg mt-6 disabled:opacity-50"
						disabled={!id || isLoading}
						onClick={handleSendCode}
					>
						{isLoading ? "Checking..." : "Send Reset Code"}
					</Button>
				</Card>
			)}

			{/* Step 2 */}
			{step === 2 && (
				<Card onBack={handleBack}>
					<div className="flex flex-col items-center justify-center mt-2">
						<Mail className="mb-4 text-blue-700" size={40} />
						<p className="text-blue-900 mb-4 mt-4 text-lg font-semibold">
							Enter the 6-digit code sent to your registered email.
						</p>
						<div className="w-full max-w-xs">
							<FocusableInput
								ref={codeInputRef}
								type="text"
								value={code}
								onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
								maxLength={6}
								placeholder="Enter code"
								className="mb-2 text-center tracking-widest text-lg"
							/>
							<Button
								onClick={handleVerifyCode}
								disabled={code.length !== 6}
								className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-base rounded-lg mb-2"
							>
								Verify Code
							</Button>
							{codeError && <div className="text-red-500 text-xs mb-2">{codeError}</div>}
							<Button
								onClick={handleResendCode}
								className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-base rounded-lg mb-2"
								disabled={resendCount >= 3}
							>
								Resend Code
							</Button>
							<div className="text-xs text-gray-500 mb-2 text-center">
								{resendCount >= 3
									? "You have reached the maximum number of resends for today."
									: `You can resend the code ${3 - resendCount} more time(s) today.`}
							</div>
						</div>
					</div>
				</Card>
			)}

			{/* Step 3 */}
			{step === 3 && (
				<Card onBack={handleBack}>
					<div className="flex flex-col items-center justify-center mt-2">
						<p className="text-blue-900 mb-4 mt-4 text-lg font-semibold">
							Email verified! Set your new password below.
						</p>
						<div className="mb-4 w-full">
							<label className="block mb-2 text-blue-900 text-base font-semibold">Password</label>
							<div className="relative">
								<FocusableInput
									ref={passwordInputRef}
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter password"
									className="bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300"
								/>
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-700 transition"
									onClick={() => setShowPassword((v) => !v)}
									tabIndex={-1}
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>
						<div className="mb-6 w-full">
							<label className="block mb-2 text-blue-900 text-base font-semibold">Confirm Password</label>
							<div className="relative">
								<FocusableInput
									ref={confirmInputRef}
									type={showConfirm ? "text" : "password"}
									value={confirm}
									onChange={(e) => setConfirm(e.target.value)}
									placeholder="Confirm password"
									className="bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300"
								/>
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
								<button
									type="button"
									className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-700 transition"
									onClick={() => setShowConfirm((v) => !v)}
									tabIndex={-1}
									aria-label={showConfirm ? "Hide password" : "Show password"}
								>
									{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>
						<Button
							type="button"
							className="bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 mb-2 w-full h-12 text-lg"
							onClick={handleResetPassword}
							disabled={!password || !confirm || password !== confirm}
						>
							Reset Password
						</Button>
						{password && confirm && password !== confirm && (
							<div className="text-red-500 mt-2 text-sm">Passwords do not match.</div>
						)}
						{inputError && <div className="text-red-500 mt-2 text-sm">{inputError}</div>}
					</div>
				</Card>
			)}

			{/* Step 4 */}
			{step === 4 && (
				<Card onBack={handleBack}>
					<div className="flex flex-col items-center justify-center h-64">
						<p className="text-blue-700 mb-6 text-lg text-center">
							Password reset successful! You can now login.
						</p>
						<Button
							type="button"
							className="bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 w-full h-12 text-lg font-bold rounded-xl"
							onClick={handleBack}
						>
							Back to Main
						</Button>
					</div>
				</Card>
			)}
		</div>
	);
}
