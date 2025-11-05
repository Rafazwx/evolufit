export default function Groups({ user }) {
  const grupos = [
    { id: 1, name: "Desafio 30 dias", description: "Complete 30 treinos em 30 dias", joined: true },
    { id: 2, name: "Amigos da Academia", description: "Competição amigável de frequência semanal", joined: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-800">EvuluFit - Grupos e Desafios</h1>
        {user && <p className="mt-2 text-lg text-indigo-700">Participante: {user.nome}</p>}
      </header>
      <main className="max-w-lg mx-auto space-y-6">
        {grupos.map(({ id, name, description, joined }) => (
          <div key={id} className="bg-white shadow-lg rounded-xl p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-indigo-700">{name}</h2>
            <p className="text-gray-700 mb-4">{description}</p>
            <button
              className={`self-start px-4 py-2 rounded-lg font-medium transition ${
                joined ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {joined ? "Participando" : "Entrar"}
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}

