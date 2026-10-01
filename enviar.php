<?php
/* =========================================================
   Imperial Urbanismo — recebe os formulários do site.

   Para cada envio:
     1. guarda uma cópia do contato fora da área pública
        (/home/imperial/form-leads/AAAA-MM.jsonl), para nada se perder;
     2. manda o aviso por e-mail para contato@ via Resend
        (o Gmail/Workspace da Imperial não é tocado);
     3. filtra robôs (campo invisível, tempo mínimo e limite por IP).

   A chave do Resend NÃO fica aqui: vem de /home/imperial/config/form-config.php,
   que retorna ['resend_key' => '...', 'from' => '...', 'to' => '...'].
   Sem esse arquivo, o contato é guardado e o e-mail fica para depois.

   Quando a Central da Imperial existir, é aqui que entra a gravação
   no banco dela; os formulários do site não mudam.
   ========================================================= */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const LIMITE_POR_IP = 6;      // envios por janela
const JANELA_SEG    = 600;    // 10 minutos
const TEMPO_MIN_MS  = 2500;   // menos que isso = robô

function sai(int $code, array $body): void { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
function limpa($v, int $max): string { $v = trim((string)($v ?? '')); $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? ''; return mb_substr($v, 0, $max); }
function h(string $v): string { return htmlspecialchars($v, ENT_QUOTES, 'UTF-8'); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sai(405, ['ok' => false, 'erro' => 'método']);

/* só aceita envio vindo do próprio site */
$origem = parse_url($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST) ?: '';
$permitidos = ['imperialurbanismo.com.br', 'www.imperialurbanismo.com.br'];
if (!in_array(strtolower($origem), $permitidos, true)) sai(403, ['ok' => false, 'erro' => 'origem']);

$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) sai(400, ['ok' => false, 'erro' => 'formato']);

/* robôs: respondem "ok" para não aprenderem que foram barrados */
if (limpa($in['website'] ?? '', 200) !== '' || (int)($in['t'] ?? 0) < TEMPO_MIN_MS) sai(200, ['ok' => true]);

$BASE   = dirname(__DIR__);                 // /home/imperial
$LEADS  = $BASE . '/form-leads';
if (!is_dir($LEADS)) { @mkdir($LEADS, 0700, true); @file_put_contents($LEADS . '/.htaccess', "Require all denied\n"); }

/* limite por IP */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$rl = $LEADS . '/.rl-' . hash('sha256', $ip) ;
$agora = time();
$marcas = array_filter(array_map('intval', @file($rl, FILE_IGNORE_NEW_LINES) ?: []), fn($x) => $x > $agora - JANELA_SEG);
if (count($marcas) >= LIMITE_POR_IP) sai(429, ['ok' => false, 'erro' => 'limite']);
$marcas[] = $agora;
@file_put_contents($rl, implode("\n", $marcas), LOCK_EX);

/* campos */
$tipos = ['contato' => 'Contato pelo site', 'interesse' => 'Cadastro de interesse', 'newsletter' => 'Novidades da Imperial'];
$tipo  = array_key_exists($in['tipo'] ?? '', $tipos) ? $in['tipo'] : 'contato';
$d = [
  'nome'          => limpa($in['nome'] ?? '', 120),
  'email'         => limpa($in['email'] ?? '', 160),
  'telefone'      => limpa($in['telefone'] ?? '', 40),
  'assunto'       => limpa($in['assunto'] ?? '', 120),
  'mensagem'      => limpa($in['mensagem'] ?? '', 4000),
  'empreendimento'=> limpa($in['empreendimento'] ?? '', 120),
  'aceite'        => !empty($in['aceite']),
  'pagina'        => limpa($in['pagina'] ?? '', 200),
];
if ($d['nome'] === '' || !filter_var($d['email'], FILTER_VALIDATE_EMAIL)) sai(422, ['ok' => false, 'erro' => 'campos']);
if ($tipo === 'interesse' && !$d['aceite']) sai(422, ['ok' => false, 'erro' => 'aceite']);

/* 1. guarda a cópia (uma linha JSON por contato, um arquivo por mês) */
$registro = ['id' => bin2hex(random_bytes(6)), 'quando' => date('c'), 'tipo' => $tipo] + $d + ['ip_hash' => substr(hash('sha256', $ip), 0, 16)];
$gravou = @file_put_contents($LEADS . '/' . date('Y-m') . '.jsonl', json_encode($registro, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;

/* 2. e-mail para a Imperial */
$enviou = false;
$cfgArq = $BASE . '/config/form-config.php';
if (is_file($cfgArq)) {
  $cfg = require $cfgArq;
  $assunto = $tipos[$tipo] . ' — ' . ($d['empreendimento'] ?: ($d['assunto'] ?: $d['nome']));
  $linhas = [
    'Nome' => $d['nome'], 'E-mail' => $d['email'], 'Telefone' => $d['telefone'],
    'Empreendimento' => $d['empreendimento'], 'Assunto' => $d['assunto'], 'Mensagem' => $d['mensagem'],
    'Aceite de contato' => $tipo === 'interesse' ? ($d['aceite'] ? 'sim' : 'não') : '',
    'Página' => $d['pagina'], 'Recebido em' => date('d/m/Y H:i'),
  ];
  $html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0F0F10;max-width:560px">'
        . '<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#525642;margin:0 0 6px">' . h($tipos[$tipo]) . '</p>'
        . '<h2 style="font-weight:400;color:#3C3F2E;margin:0 0 18px">' . h($d['nome']) . '</h2><table cellpadding="8" style="border-collapse:collapse;width:100%">';
  foreach ($linhas as $k => $v) if ($v !== '') $html .= '<tr><td style="color:#525642;border-bottom:1px solid #E9E3CF;width:150px;vertical-align:top">' . h($k) . '</td><td style="border-bottom:1px solid #E9E3CF">' . nl2br(h($v)) . '</td></tr>';
  $html .= '</table><p style="font-size:12px;color:#777;margin-top:18px">Responda este e-mail para falar direto com quem preencheu.</p></div>';

  $ch = curl_init('https://api.resend.com/emails');
  curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $cfg['resend_key'], 'Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
      'from' => $cfg['from'], 'to' => [$cfg['to']], 'reply_to' => $d['email'],
      'subject' => $assunto, 'html' => $html,
    ], JSON_UNESCAPED_UNICODE),
  ]);
  $resp = curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $enviou = $code >= 200 && $code < 300;
  if (!$enviou) @file_put_contents($LEADS . '/erros.log', date('c') . " resend $code " . substr((string)$resp, 0, 300) . "\n", FILE_APPEND | LOCK_EX);
}

if (!$gravou && !$enviou) sai(500, ['ok' => false, 'erro' => 'servidor']);
sai(200, ['ok' => true]);
