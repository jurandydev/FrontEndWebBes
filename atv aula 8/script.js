const API_URL = "https://postman-echo.com/post";

const form = document.getElementById("formCadastro");
const btnEnviar = document.getElementById("btnEnviar");

/* ---------- Máscaras ---------- */

function mascaraCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraTelefone(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10) {
    return n
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return n
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function mascaraCEP(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

document.getElementById("cpf").addEventListener("input", (e) => {
  e.target.value = mascaraCPF(e.target.value);
});
document.getElementById("telefone").addEventListener("input", (e) => {
  e.target.value = mascaraTelefone(e.target.value);
});
document.getElementById("cep").addEventListener("input", (e) => {
  e.target.value = mascaraCEP(e.target.value);
});

/* ---------- Validadores auxiliares ---------- */

function cpfValido(cpf) {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;

  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) {
      soma += parseInt(n[i]) * (t + 1 - i);
    }
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== parseInt(n[t])) return false;
  }
  return true;
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function idadeDe(dataISO) {
  const hoje = new Date();
  const nasc = new Date(dataISO);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

/* ---------- Regras de validação por campo ---------- */
/* Cada regra retorna uma mensagem de erro ou "" se válido. */

const regras = {
  nome: (v) => {
    if (!v.trim()) return "Informe o nome completo.";
    if (v.trim().split(/\s+/).length < 2) return "Informe nome e sobrenome.";
    if (v.trim().length < 5) return "Nome muito curto.";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "Informe o e-mail.";
    if (!emailValido(v.trim())) return "E-mail inválido.";
    return "";
  },
  cpf: (v) => {
    if (!v.trim()) return "Informe o CPF.";
    if (!cpfValido(v)) return "CPF inválido.";
    return "";
  },
  telefone: (v) => {
    const n = v.replace(/\D/g, "");
    if (!n) return "Informe o telefone.";
    if (n.length < 10) return "Telefone incompleto.";
    return "";
  },
  nascimento: (v) => {
    if (!v) return "Informe a data de nascimento.";
    const nasc = new Date(v);
    if (nasc > new Date()) return "A data não pode ser futura.";
    if (idadeDe(v) < 18) return "É necessário ter 18 anos ou mais.";
    if (idadeDe(v) > 120) return "Data de nascimento inválida.";
    return "";
  },
  genero: (v) => (v ? "" : "Selecione uma opção."),
  cep: (v) => {
    const n = v.replace(/\D/g, "");
    if (!n) return "Informe o CEP.";
    if (n.length !== 8) return "CEP deve ter 8 dígitos.";
    return "";
  },
  cidade: (v) => {
    if (!v.trim()) return "Informe a cidade.";
    if (v.trim().length < 2) return "Cidade inválida.";
    return "";
  },
  senha: (v) => {
    if (!v) return "Informe a senha.";
    if (v.length < 8) return "Mínimo de 8 caracteres.";
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) {
      return "Use letras e números.";
    }
    return "";
  },
  confirmaSenha: (v) => {
    if (!v) return "Confirme a senha.";
    if (v !== document.getElementById("senha").value) {
      return "As senhas não coincidem.";
    }
    return "";
  },
  termos: () =>
    document.getElementById("termos").checked
      ? ""
      : "Você deve aceitar os termos.",
};

function validarCampo(nome) {
  const el = document.getElementById(nome);
  const valor = el.type === "checkbox" ? "" : el.value;
  const mensagem = regras[nome](valor);
  const wrapper = el.closest(".campo");
  const spanErro = document.getElementById(`erro-${nome}`);

  spanErro.textContent = mensagem;
  wrapper.classList.toggle("invalido", mensagem !== "");
  wrapper.classList.toggle("valido", mensagem === "" && el.type !== "checkbox");
  return mensagem === "";
}

/* Limpa o erro de um campo assim que o usuário volta a editá-lo. */
Object.keys(regras).forEach((nome) => {
  const el = document.getElementById(nome);
  const evento = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
  el.addEventListener(evento, () => {
    if (el.closest(".campo").classList.contains("invalido")) {
      validarCampo(nome);
    }
  });
});

/* ---------- Submissão ---------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let formularioValido = true;
  let primeiroInvalido = null;

  Object.keys(regras).forEach((nome) => {
    const ok = validarCampo(nome);
    if (!ok) {
      formularioValido = false;
      if (!primeiroInvalido) primeiroInvalido = document.getElementById(nome);
    }
  });

  if (!formularioValido) {
    primeiroInvalido.focus();
    return;
  }

  // Monta o payload (nunca envia a confirmação nem a senha em texto claro além do necessário)
  const dados = {
    nome: document.getElementById("nome").value.trim(),
    email: document.getElementById("email").value.trim(),
    cpf: document.getElementById("cpf").value,
    telefone: document.getElementById("telefone").value,
    nascimento: document.getElementById("nascimento").value,
    genero: document.getElementById("genero").value,
    cep: document.getElementById("cep").value,
    cidade: document.getElementById("cidade").value.trim(),
    senha: document.getElementById("senha").value,
    termos: document.getElementById("termos").checked,
  };

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const retorno = await resposta.json();
    alert("Retorno da API:\n\n" + JSON.stringify(retorno, null, 2));
  } catch (erro) {
    alert("Falha ao enviar o formulário: " + erro.message);
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Cadastrar";
  }
});
