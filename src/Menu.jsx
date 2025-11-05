
export default function Menu({ currentScreen, onChangeScreen, onLogout }) {
  return (
    <nav className="bg-indigo-600 dark:bg-gray-900 text-white flex justify-center space-x-6 p-4">
      <button
        onClick={() => onChangeScreen('home')}
        className={`px-3 py-2 rounded ${currentScreen === 'home' ? 'bg-indigo-800 text-white font-bold' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        Lar
      </button>
      <button
        onClick={() => onChangeScreen('groups')}
        className={`px-3 py-2 rounded ${currentScreen === 'groups' ? 'bg-indigo-800 text-white font-bold' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        Grupos
      </button>
      <button
        onClick={() => onChangeScreen('profile')}
        className={`px-3 py-2 rounded ${currentScreen === 'profile' ? 'bg-indigo-800 text-white font-bold' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        Perfil
      </button>
      <button
        onClick={() => onChangeScreen('ranking')}
        className={`px-3 py-2 rounded ${currentScreen === 'ranking' ? 'bg-indigo-800 text-white font-bold' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        Classificação
      </button>
      <button
        onClick={() => onChangeScreen('feed')}
        className={`px-3 py-2 rounded ${currentScreen === 'feed' ? 'bg-indigo-800 text-white font-bold' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        Feed
      </button>
      <button
        onClick={onLogout}
        className="px-3 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700"
      >
        Sair
      </button>
    </nav>
  );
}
