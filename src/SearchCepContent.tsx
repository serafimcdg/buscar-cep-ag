import { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface EnderecoData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep: string;
}

const SearchCepContent: React.FC = () => {
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState<EnderecoData | null>(null);
  const [enderecosSalvos, setEnderecosSalvos] = useState<EnderecoData[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [selectedEnderecos, setSelectedEnderecos] = useState<number[]>([]);

  useEffect(() => {
    const enderecosSalvos = localStorage.getItem("enderecosSalvos");
    if (enderecosSalvos) {
      const parsedEndereco = JSON.parse(enderecosSalvos);
      setEnderecosSalvos(parsedEndereco);
      if (parsedEndereco.length > 0) {
        setHistoricoAberto(true);
      }
    }
  }, []);

  const mostrarHistorico = () => {
    setHistoricoAberto(!historicoAberto);
  };

  const buscarEndereco = async () => {
    const sanitizeCep = cep.replace(/\D/g, "");
    if (sanitizeCep.length !== 8) {
      toast.error("Digite um CEP valido");
      return;
    }

    const localEnderecos = localStorage.getItem("enderecosSalvos");
    console.log(localEnderecos, "enderecosSalvos");

    const parsedEndereco: EnderecoData[] = localEnderecos
      ? JSON.parse(localEnderecos)
      : [];

    const existingEndereco = parsedEndereco.find(
      (addr) => addr.cep.replace(/\D/g, "") === sanitizeCep
    );

    if (existingEndereco) {
      toast.info("CEP ja informado. Verifique o historico");
      return;
    }

    const response = await fetch(
      `https://viacep.com.br/ws/${sanitizeCep}/json/`
    );
    const data = await response.json();

    if (data.erro) {
      toast.error("Não foi possivel encontrar o CEP " + `${sanitizeCep}`);
    } else {
      const newendereco: EnderecoData = {
        logradouro: data.logradouro,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        cep: data.cep,
      };

      setEndereco(newendereco);
      toast.success("Endereço encontrado");
    }
  };

  //Formata cep
  const atualizarCep = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizeCep = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formattedCep = sanitizeCep;

    if (sanitizeCep.length > 5) {
      formattedCep = sanitizeCep.replace(/(\d{5})(\d{3})/, "$1-$2");
    }
    setCep(formattedCep);
    console.log(formattedCep, "cep formatado");
  };

  const salvarNoHistorico = () => {
    if (!endereco) return;
    const updateEnderecos = [...enderecosSalvos, endereco];
    setEnderecosSalvos(updateEnderecos);
    localStorage.setItem("enderecosSalvos", JSON.stringify(updateEnderecos));
    setHistoricoAberto(true);
    saveEndereco(endereco);
    toast.success("Endereco salvo com sucesso.");
    setEndereco(null);
    setCep("");
  };

  const alternarSelecao  = (index: number) => {
    setSelectedEnderecos((prevSelected) =>
      prevSelected.includes(index)
        ? prevSelected.filter((i) => i !== index)
        : [...prevSelected, index]
    );
  };

  const deletarSelecionados = () => {
    //Cria um novo array a partir dos nao selecionados
    const updateEnderecos = enderecosSalvos.filter(
      (_, index) => !selectedEnderecos.includes(index)
    );
    setEnderecosSalvos(updateEnderecos);
    localStorage.setItem("enderecosSalvos", JSON.stringify(updateEnderecos));
    setSelectedEnderecos([]);
    toast.success("Endereço excluido cm sucesso");
  };

  const saveEndereco = async (payload: EnderecoData) => {
    const res = await fetch("https://reqres.in/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.log(res);
    }
  };
  return (
    <div className="container mx-auto p-6">
      <ToastContainer autoClose={3000} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            value={cep}
            onChange={atualizarCep}
            placeholder="Digite o CEP"
            maxLength={9}
            className="border p-2 rounded border-[1px] border-[#04C1F3] w-full"
          />

          <button
            onClick={buscarEndereco}
            className="w-full sm:w-auto min-w-[180px] bg-[#13679f] text-white py-2 px-4 rounded hover:bg-[#0e4d77] self-end font-bold"
          >
            Buscar
          </button>

          {endereco && (
            <div className="border p-4 rounded-lg bg-gray-100 border-[1px] border-[#04C1F3] shadow-md relative group">
              <div className="grid grid-cols-2 gap-x-4 text-gray-700">
                <p>
                  <strong>Logradouro:</strong> {endereco.logradouro}
                </p>
                <p>
                  <strong>Bairro:</strong> {endereco.bairro}
                </p>
                <p>
                  <strong>Cidade:</strong> {endereco.localidade}
                </p>
                <p>
                  <strong>Estado:</strong> {endereco.uf}
                </p>
              </div>

              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${endereco.logradouro}, ${endereco.bairro}, ${endereco.localidade}, ${endereco.uf}`
                    )}`,
                    "_blank"
                  )
                }
                className="absolute top-0 left-0 w-full h-full bg-[#04C1F3] bg-opacity-0 flex items-center justify-center text-[#13679F] font-bold opacity-0 group-hover:opacity-100 group-hover:bg-opacity-80 transition-all duration-300 cursor-pointer"
              >
                Ver no Mapa
              </button>
            </div>
          )}

          {endereco && (
            <button
              onClick={salvarNoHistorico}
              className="w-full sm:w-auto min-w-[180px] bg-[#28a745] text-white py-2 px-4 rounded hover:bg-[#218838] self-end font-bold"
            >
              Salvar
            </button>
          )}
        </div>

        <div>
          <button
            onClick={mostrarHistorico}
            className="w-full bg-[#13679F] text-black py-2 rounded mb-4 flex items-center justify-between px-4"
          >
            <div className="text-white font-bold text-xl w-full text-center">
              Histórico de endereços
            </div>
            <img
              src="/Arrow-Drop.svg"
              alt="Seta"
              className={`w-5 h-5 transition-transform duration-300 ${
                historicoAberto ? "rotate-90" : "-rotate-90"
              }`}
            />
          </button>
          {historicoAberto &&
            enderecosSalvos.map((savedendereco, index) => (
              <div
                key={index}
                className="border p-4 rounded shadow-md mb-4 flex flex-col gap-2"
              >
                <div className="text-lg font-bold text-[#13679F]">
                  <span>CEP: </span> {savedendereco.cep}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedEnderecos.includes(index)}
                    onChange={() => alternarSelecao (index)}
                    className={`relative w-6 h-6 rounded-md border-2 transition-all duration-300 cursor-pointer ${
                        selectedEnderecos.includes(index)
                        ? "bg-[#04C1F3] border-[#04C1F3]"
                        : "bg-transparent border-[#04C1F3]"
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {selectedEnderecos.includes(index) && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                  </Switch>

                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${savedendereco.logradouro}, ${savedendereco.bairro}, ${savedendereco.localidade}, ${savedendereco.uf}`
                        )}`,
                        "_blank"
                      )
                    }
                    className="border p-2 rounded w-full bg-gray-200 cursor-pointer border-[1px] border-[#04C1F3] relative group transition-all duration-300 hover:bg-gray-300 focus:outline-none"
                  >
                    <p className="text-gray-700 font-medium">
                      {`${savedendereco.logradouro}, ${savedendereco.bairro}, ${savedendereco.localidade} - ${savedendereco.uf}`}
                    </p>

                    <div className="absolute top-0 left-0 w-full h-full bg-[#04C1F3] bg-opacity-80 flex items-center justify-center text-[#13679F] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Ver no Mapa
                    </div>
                  </button>
                </div>
              </div>
            ))}

          {selectedEnderecos.length > 0 && historicoAberto && (
            <div>
              <button
                onClick={() => {
                  if (selectedEnderecos.length === enderecosSalvos.length) {
                    setSelectedEnderecos([]);
                  } else {
                    setSelectedEnderecos(
                      enderecosSalvos.map((_, index) => index)
                    );
                  }
                }}
                className="w-full sm:w-auto min-w-[180px]  bg-[#13679F] text-white py-2 px-4 rounded hover:bg-[#0e4d77] mr-6 self-end font-bold mb-2"
              >
                {selectedEnderecos.length === enderecosSalvos.length
                  ? "Desmarcar Todos"
                  : "Selecionar Todos"}
              </button>
              <button
                onClick={deletarSelecionados}
                className="w-full sm:w-auto min-w-[180px] bg-[#DC3545] text-white py-2 px-4 rounded hover:bg-[#B22222] self-end font-bold"
              >
                Excluir Selecionados
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchCepContent;
