
export default function Home({ user, adicionarTreino }) {
  const treinos = [
    {
      id: 1,
      title: "Treino Corpo Inteiro",
      description: "Treino completo para todos os grupos musculares, ideal para iniciantes e intermediários.",
    },
    {
      id: 2,
      title: "Treino Focado em Braços",
      description: "Concentre-se em bíceps, tríceps e antebraços neste treino intenso.",
    },
    {
      id: 3,
      title: "Treino Cardio e Resistência",
      description: "Melhore sua resistência cardiovascular com essa rotina dinâmica.",
    },
  ];

  function handleComecarTreino(treino) {
    adicionarTreino({
      id: treino.id,
      title: treino.title,
      data: new Date().toLocaleString(),
    });
  }

  return (
    // Soma o dark só no bg do container principal
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-200 dark:bg-gray-900 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-800">Evolufit - Treinos</h1>
        {user && <p className="mt-2 text-lg text-indigo-700">Olá, {user.nome}!</p>}
      </header>
      <main className="max-w-lg mx-auto space-y-6">
        {treinos.map((treino) => (
          <div key={treino.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <h2 className="text-xl font-semibold mb-2 text-indigo-700">{treino.title}</h2>
            <p className="text-gray-700 mb-4">{treino.description}</p>
            <button
              className="self-start bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              onClick={() => handleComecarTreino(treino)}
            >
              Começar Treino
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}
