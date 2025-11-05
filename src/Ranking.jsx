
const ranking = [
  { pos: 1, nome: "Amanda Costa", pontos: 880, foto: "https://ui-avatars.com/api/?name=Amanda+Costa" },
  { pos: 2, nome: "Rafael Souza", pontos: 815, foto: "https://ui-avatars.com/api/?name=Rafael+Souza" },
  { pos: 3, nome: "Lucas Mendes", pontos: 790, foto: "https://ui-avatars.com/api/?name=Lucas+Mendes" },
  { pos: 4, nome: "Ana Paula", pontos: 760, foto: "https://ui-avatars.com/api/?name=Ana+Paula" },
];

export default function Ranking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-200 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-indigo-800 mb-6">Classificação de usuários</h1>
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2">posição</th>
              <th>Usuário</th>
              <th>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((user) => (
              <tr key={user.pos} className="border-t">
                <td className="py-2 text-center font-bold">{user.pos}</td>
                <td className="flex items-center gap-2 py-2">
                  <img src={user.foto} alt={user.nome} className="w-8 h-8 rounded-full border" />
                  {user.nome}
                </td>
                <td className="text-center">{user.pontos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
