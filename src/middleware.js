import { NextResponse } from 'next/server';

export function middleware(req) {
  // 1. Buscamos la cookie de Supabase (el nombre suele empezar con 'sb-')
  const allCookies = req.cookies.getAll();
  const supabaseCookie = allCookies.find(c => c.name.includes('auth-token'));
  
  const path = req.nextUrl.pathname;

  // 2. Si NO hay cookie y no estás en login, para afuera de inmediato
  if (!supabaseCookie && path !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. Si HAY cookie y el usuario está en el login, lo dejamos pasar 
  // para que el AuthContext haga su magia de redirección interna.
  if (supabaseCookie && path === '/login') {
    // Aquí podrías redirigir a /stapla o /calidad si tuvieras el rol,
    // pero como el Middleware no puede leer el contenido de la cookie fácilmente,
    // mejor dejamos que el AuthContext decida al cargar la página.
    return NextResponse.next();
  }

  return NextResponse.next();
}

// IMPORTANTE: Excluir TODO lo que no sea una página real
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};