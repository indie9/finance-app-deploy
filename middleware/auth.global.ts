export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Страницы, доступные без авторизации.
  const publicPages = ['/login', '/register']

  // Страницы только для гостей: если пользователь уже вошёл,
  // не пускаем его обратно на формы входа и регистрации.
  const guestOnlyPages = ['/login', '/register']

  if (!user.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  if (user.value && guestOnlyPages.includes(to.path)) {
    return navigateTo('/')
  }
})
