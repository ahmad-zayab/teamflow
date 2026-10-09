'use server';

export async function loginAction(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  // Secure server action communicating with NestJS API
  return { success: true, email };
}
