import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

const schema = z.object({ username: z.string().min(3, 'Username must be at least 3 characters') });

type LoginForm = z.infer<typeof schema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  async function onSubmit(values: LoginForm) {
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.login(values.username);
      setUser(user, accessToken, refreshToken);
      navigate('/');
    } catch {
      try {
        const { user, accessToken, refreshToken } = await authService.register(values.username);
        setUser(user, accessToken, refreshToken);
        navigate('/');
      } catch (error) {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-[26px] border border-border bg-surface p-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center text-center">
            <img src="/logo.png" alt="VoxLink Logo" className="h-16 w-16 mb-4 rounded-xl shadow-lg bg-black" />
            <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">VoxLink</p>
            <h1 className="mt-3 text-3xl font-semibold text-text">Welcome</h1>
          </div>
          <p className="text-sm leading-6 text-text-secondary">Enter a simple username to start messaging instantly.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-text-secondary">Username</label>
          <input
            {...register('username')}
            placeholder="Your username"
            className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-text outline-none transition focus:border-white"
          />
          {errors.username ? (
            <p className="text-sm text-red-400" role="alert">
              {errors.username.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-4 py-4 text-sm font-semibold text-primary-text transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Connecting…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-text-secondary">
          Simple and private. No extra clutter.
        </p>
      </div>
    </div>
  );
}
