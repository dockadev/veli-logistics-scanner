import { en } from './en'

export const ptBR: Partial<Record<keyof typeof en, string>> = {
  app_title: 'Scanner de Logística',
  language: 'Idioma',
  loading: 'Carregando...',
  sign_out: 'Sair',
  username_label: 'Nome de Usuário',
  password_label: 'Senha',
  remember_me: 'Lembre de mim',
  username_placeholder: 'logislave',
  login_button: 'Entrar',
  connecting: 'Conectando...',

  login_subtitle:
    'Faça login para importar seus arquivos de salvamento do Foxhole no banco de dados logístico.',
  registration_note:
    'O cadastro é feito pelo painel de contas. Este aplicativo importa dados apenas com uma conta existente.',
  register_redirect: 'Ainda não tem conta? Cadastre-se no site',
  error_username:
    'O nome de usuário pode conter apenas letras, números e underscore.',
  error_credentials: 'Nome de usuário ou senha incorretos.',
  error_generic: 'Não foi possível concluir o login. Verifique sua conexão e tente novamente.',
  error_db_missing: 'A configuração do banco de dados está ausente.',

  config_missing_title: 'Configuração ausente',
  config_missing_desc:
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidos. Verifique o arquivo .env na raiz do projeto.',

  save_files: 'Arquivos de salvamento',
  not_searched: 'Ainda não pesquisado.',
  show_more_files: '+{count} arquivos',
  show_less: 'Mostrar menos',
  scan_and_import: 'Escanear e importar',
  detect: 'Busca automática',

  region_count: 'Regiões',
  depot_count: 'Depósitos',
  item_varieties: 'Variedades de itens',
  written: 'Escritos',
  scanned_regions: 'Regiões verificadas',
  regions_hover_hint: 'Passe o mouse sobre uma região para ver seus depósitos',
  region_hover_hint: 'Mostrar os depósitos desta região',
  storage: 'Depósito',
  seaport: 'Porto',
  aircraft: 'Aeródromo',
  item_count: '{count} itens',
  unresolved_codenames:
    '{count} codenames não puderam ser resolvidos. Se o jogo adicionou novos itens, atualize o codenames.json.',

  log_title: 'Registro',
  log_empty: 'Ainda não há atividade.',

  log_session_restored: 'Sessão restaurada: {username}',
  log_searching: 'Procurando arquivos de salvamento...',
  log_no_save_files: 'Nenhum arquivo .sav encontrado no diretório.',
  log_files_found: '{count} arquivos de salvamento encontrados ({size}).',
  log_no_save_readable: 'Nenhum arquivo de salvamento pôde ser lido.',
  log_scan_done:
    '{shards} shards lidos, {depots} depósitos em {regions} regiões, {varieties} variedades de itens.',
  log_no_depots:
    'O Foxhole baixa os dados do mapa do servidor; salvamentos locais contêm apenas depósitos que você fixou. Fixe um depósito no jogo e tente novamente.',
  log_depots_written: '{count} depósitos escritos no banco de dados.',
  log_depots_staged: '{count} novos depósitos enfileirados para aprovação de oficial.',
  log_depots_updated: '{count} depósitos existentes atualizados.',
  log_not_written: 'Não enviado: nenhuma sessão ativa.',
  approval_not_approved:
    'Sua conta ainda não foi aprovada. Um oficial precisa aprová-la antes que você possa importar dados.',
  approval_unverifiable:
    'Não foi possível verificar seu status de aprovação. Verifique sua conexão e tente novamente.',
  log_unresolved: '{count} codenames não puderam ser resolvidos.',
  log_signed_out: 'Sessão encerrada.',
}