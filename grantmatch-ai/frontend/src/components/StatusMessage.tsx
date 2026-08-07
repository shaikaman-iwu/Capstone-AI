type StatusMessageProps = {
  variant: "error" | "info" | "success";
  message: string;
};

const styles = {
  error: "border-[#f0b5a5] bg-[#fff0ea] text-[#7e331d]",
  info: "border-[#bed7cb] bg-[#eef5f0] text-moss",
  success: "border-[#b6d6bd] bg-[#eef8f0] text-[#285746]",
};

export default function StatusMessage({ variant, message }: StatusMessageProps) {
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant]}`}>{message}</div>;
}
