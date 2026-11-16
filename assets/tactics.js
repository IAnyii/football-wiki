/* 足球战术动画 —— 数据 + 渲染引擎（无依赖） */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 1050, H = 698, PAD = 25;
  var IW = W - PAD * 2, IH = H - PAD * 2;
  var $ = function (id) { return document.getElementById(id); };
  var px = function (x) { return PAD + x * IW; };
  var py = function (y) { return PAD + y * IH; };

  /* ---------------- 数据 ---------------- */
  var TACTICS = [
    {
      id: 'counter', num: '01', name: '防守反击', en: 'COUNTER-ATTACK', page: '06',
      quote: '先为不可胜，以待敌之可胜。',
      who: '穆里尼奥 · 国际米兰 2009 ／ 西蒙尼 · 马德里竞技',
      note: '低位防守 → 压迫触发点 → 3 到 5 脚传递 → 一名前锋始终留在前面',
      home: [
        ['GK', 1, 0.05, 0.50], ['LB', 3, 0.20, 0.16], ['CB1', 4, 0.17, 0.38], ['CB2', 5, 0.17, 0.62],
        ['RB', 2, 0.20, 0.84], ['LM', 11, 0.32, 0.20], ['CM1', 6, 0.30, 0.42], ['CM2', 8, 0.30, 0.58],
        ['RM', 7, 0.32, 0.80], ['ST1', 9, 0.45, 0.40], ['ST2', 10, 0.45, 0.60]
      ],
      away: [
        ['GK', 1, 0.95, 0.50], ['LB', 12, 0.78, 0.14], ['CB1', 15, 0.80, 0.36], ['CB2', 16, 0.80, 0.64],
        ['RB', 13, 0.78, 0.86], ['DM', 6, 0.68, 0.50], ['CM1', 8, 0.62, 0.30], ['CM2', 10, 0.62, 0.70],
        ['LW', 11, 0.52, 0.14], ['RW', 7, 0.52, 0.86], ['ST', 9, 0.50, 0.50]
      ],
      frames: [
        { t: '低位防守', d: '4-4-2 收缩在自家三十米区，中路站满人，请对手走边路。', b: [0.72, 0.36] },
        {
          t: '压迫触发点', d: '球到边后卫＝开关打开：边前卫上抢，中场封住内线，后卫线整体前顶。', b: [0.75, 0.13],
          mv: { LM: [0.38, 0.30], RM: [0.66, 0.17], CM1: [0.36, 0.40], CB1: [0.23, 0.42], CB2: [0.20, 0.62], LB: [0.24, 0.18] },
          ar: [[0.34, 0.78, 0.63, 0.17]], zn: [0.62, 0.0, 0.38, 0.34]
        },
        {
          t: '抢断', d: '断球后第一脚向前，不回头；三名队友立刻由守转攻。', b: [0.60, 0.30],
          mv: { RM: [0.62, 0.24], CM1: [0.48, 0.32], ST1: [0.55, 0.36], CM2: [0.40, 0.56] },
          ar: [[0.66, 0.17, 0.50, 0.33]], hi: ['hCM1']
        },
        {
          t: '由守转攻', d: '一脚直塞打身后；另一名前锋拉边，把中卫带离中路。', b: [0.64, 0.38],
          mv: { ST1: [0.68, 0.42], ST2: [0.66, 0.72], CM1: [0.52, 0.40], LM: [0.30, 0.14] },
          ar: [[0.50, 0.33, 0.66, 0.41]]
        },
        {
          t: '终结', d: '5 秒内完成射门：这就是反击的全部价值。', b: [0.88, 0.46],
          mv: { ST1: [0.89, 0.46], ST2: [0.75, 0.70], CM1: [0.62, 0.36], GK: [0.06, 0.50], 'aGK': [0.94, 0.50] },
          ar: [[0.68, 0.42, 0.87, 0.46]], hi: ['hST1']
        }
      ]
    },
    {
      id: 'longball', num: '02', name: '长传冲吊', en: 'LONG BALL', page: '08',
      quote: '乘人之不及，由不虞之道，攻其所不戒也。',
      who: '直接打法 · 领地 · 对抗 · 二点球',
      note: '赢下第一落点，再赢下第二落点；支点中锋身边必须有接应的人',
      home: [
        ['GK', 1, 0.06, 0.50], ['LB', 3, 0.22, 0.16], ['CB1', 4, 0.20, 0.38], ['CB2', 5, 0.20, 0.62],
        ['RB', 2, 0.22, 0.84], ['LM', 11, 0.40, 0.14], ['CM1', 6, 0.38, 0.40], ['CM2', 8, 0.38, 0.60],
        ['RM', 7, 0.40, 0.86], ['ST1', 9, 0.58, 0.44], ['ST2', 10, 0.58, 0.56]
      ],
      away: [
        ['GK', 1, 0.94, 0.50], ['LB', 12, 0.72, 0.14], ['CB1', 15, 0.74, 0.38], ['CB2', 16, 0.74, 0.64],
        ['RB', 13, 0.72, 0.86], ['DM1', 6, 0.55, 0.40], ['DM2', 8, 0.55, 0.60], ['LW', 11, 0.38, 0.19],
        ['AM', 10, 0.42, 0.50], ['RW', 7, 0.38, 0.81], ['ST', 9, 0.30, 0.50]
      ],
      frames: [
        { t: '直接打法', d: '对手压上来，身后就是可以攻击的空间——长传不是解围，是进攻选择。', b: [0.10, 0.50] },
        {
          t: '第一落点', d: '门将长传找支点中锋；中锋用身体卡住中卫，把球护下来。', b: [0.61, 0.43],
          mv: { ST1: [0.63, 0.44], ST2: [0.67, 0.62], CM1: [0.53, 0.44], LM: [0.44, 0.16] },
          ar: [[0.12, 0.47, 0.61, 0.42]], hi: ['hST1']
        },
        {
          t: '第二落点', d: '中锋回做，中场压上抢二点球——真正的第一次传递在这里发生。', b: [0.56, 0.52],
          mv: { ST1: [0.59, 0.46], CM1: [0.52, 0.42], CM2: [0.56, 0.54], ST2: [0.70, 0.66] },
          ar: [[0.63, 0.45, 0.57, 0.53]]
        },
        {
          t: '领地', d: '全队随球压过半场：把战场推到对方半场，减少自家球门前的对抗。', b: [0.72, 0.80],
          mv: {
            CB1: [0.36, 0.40], CB2: [0.36, 0.60], LB: [0.38, 0.18], RB: [0.38, 0.84],
            LM: [0.54, 0.16], CM1: [0.50, 0.40], CM2: [0.50, 0.58], RM: [0.64, 0.84],
            ST2: [0.74, 0.74], ST1: [0.66, 0.48]
          }
        },
        {
          t: '传中', d: '边路起球，禁区里三点包抄；第二落点依然有人。', b: [0.85, 0.62],
          mv: { ST1: [0.86, 0.44], ST2: [0.88, 0.56], CM2: [0.86, 0.66], RM: [0.72, 0.82], CM1: [0.72, 0.46] },
          ar: [[0.74, 0.82, 0.86, 0.47]], hi: ['hST1']
        }
      ]
    },
    {
      id: 'total', num: '03', name: '全攻全守', en: 'TOTAL FOOTBALL', page: '09',
      quote: '兵无常势，水无常形。',
      who: '里努斯·米歇尔斯 · 约翰·克鲁伊夫 ／ 荷兰 1974',
      note: '没有固定位置，只有临时分工：后卫前顶、前锋回撤、中场补位',
      home: [
        ['GK', 1, 0.06, 0.50], ['LB', 3, 0.24, 0.14], ['CB1', 4, 0.18, 0.36], ['CB2', 5, 0.18, 0.64],
        ['RB', 2, 0.24, 0.86], ['DM', 6, 0.36, 0.50], ['CM1', 8, 0.44, 0.30], ['CM2', 10, 0.44, 0.70],
        ['LW', 11, 0.62, 0.12], ['RW', 7, 0.62, 0.88], ['ST', 14, 0.66, 0.50, '克鲁伊夫']
      ],
      away: [
        ['GK', 1, 0.94, 0.50], ['LB', 12, 0.78, 0.16], ['CB1', 15, 0.80, 0.38], ['CB2', 16, 0.80, 0.62],
        ['RB', 13, 0.78, 0.84], ['LM', 11, 0.68, 0.16], ['CM1', 6, 0.66, 0.40], ['CM2', 8, 0.66, 0.60],
        ['RM', 7, 0.68, 0.84], ['ST1', 9, 0.52, 0.42], ['ST2', 10, 0.52, 0.58]
      ],
      frames: [
        { t: '姿态', d: '4-3-3 只是出发点：位置是暂时的，空间才是指令。', b: [0.20, 0.40] },
        {
          t: '后卫前压', d: '中卫带球压过中线，后腰立刻退到他的身后——空出来的位置必须有人补。', b: [0.47, 0.40],
          mv: { CB1: [0.47, 0.40], DM: [0.24, 0.44], CB2: [0.22, 0.62], ST: [0.50, 0.46] },
          ar: [[0.26, 0.38, 0.45, 0.39]]
        },
        {
          t: '轮转换位', d: '中场插上占住中卫的位置，前锋回撤接球；球衣号码不再决定角色。', b: [0.57, 0.33],
          mv: { CM1: [0.53, 0.24], ST: [0.45, 0.52], LW: [0.70, 0.14], RW: [0.66, 0.80], CB2: [0.30, 0.58] },
          ar: [[0.47, 0.40, 0.56, 0.33], [0.66, 0.50, 0.46, 0.51]]
        },
        {
          t: '全员压上', d: '禁区里同时出现五个人：后卫也成了进攻手，对手找不到可以盯防的人。', b: [0.80, 0.44],
          mv: {
            ST: [0.84, 0.46], CM1: [0.82, 0.34], CM2: [0.82, 0.62], LW: [0.86, 0.16], RW: [0.86, 0.80],
            DM: [0.62, 0.44], LB: [0.56, 0.20], RB: [0.56, 0.82], CB1: [0.52, 0.38], CB2: [0.50, 0.64],
            'aCB1': [0.91, 0.36], 'aCB2': [0.91, 0.64], 'aLB': [0.90, 0.14], 'aRB': [0.90, 0.84],
            'aGK': [0.96, 0.50], 'aCM1': [0.86, 0.40], 'aCM2': [0.86, 0.58]
          },
          ar: [[0.57, 0.33, 0.82, 0.41]], hi: ['hST']
        },
        {
          t: '全员防守', d: '丢球瞬间，进攻的人立刻变成防守的人：全队整体回撤，没有旁观者。', b: [0.34, 0.24],
          mv: {
            ST: [0.46, 0.44], CM1: [0.40, 0.34], CM2: [0.40, 0.66], LW: [0.44, 0.16], RW: [0.44, 0.84],
            DM: [0.30, 0.50], LB: [0.24, 0.20], RB: [0.24, 0.80], CB1: [0.20, 0.40], CB2: [0.20, 0.62]
          },
          ar: [[0.80, 0.40, 0.40, 0.32]], zn: [0.0, 0.0, 0.36, 1.0]
        }
      ]
    },
    {
      id: 'wing', num: '04', name: '两翼齐飞', en: 'WING PLAY', page: '10',
      quote: '以正合，以奇胜。',
      who: '弗格森爵士 · 曼联 · 4-4-2',
      note: '宽度拉满 → 边路 2 打 1 → 传中或倒三角 → 远端的边锋杀到后点',
      home: [
        ['GK', 1, 0.06, 0.50], ['LB', 3, 0.22, 0.14], ['CB1', 4, 0.20, 0.38], ['CB2', 5, 0.20, 0.62],
        ['RB', 2, 0.22, 0.86], ['LM', 11, 0.42, 0.10], ['CM1', 6, 0.40, 0.40], ['CM2', 8, 0.40, 0.60],
        ['RM', 7, 0.42, 0.90], ['ST1', 9, 0.60, 0.44], ['ST2', 10, 0.60, 0.56]
      ],
      away: [
        ['GK', 1, 0.94, 0.50], ['LB', 12, 0.72, 0.14], ['CB1', 15, 0.76, 0.38], ['CB2', 16, 0.76, 0.62],
        ['RB', 13, 0.72, 0.86], ['LM', 11, 0.58, 0.14], ['CM1', 6, 0.62, 0.40], ['CM2', 8, 0.62, 0.60],
        ['RM', 7, 0.58, 0.86], ['ST1', 9, 0.46, 0.44], ['ST2', 10, 0.46, 0.56]
      ],
      frames: [
        { t: '拉满宽度', d: '两名边前卫贴着边线站，把对手的四后卫拉到最大宽度。', b: [0.38, 0.52] },
        {
          t: '边路 2 打 1', d: '边后卫套边、边前卫内切：在边路制造人数优势。', b: [0.62, 0.13],
          mv: { RM: [0.62, 0.14], RB: [0.50, 0.88], CM2: [0.52, 0.52], ST1: [0.64, 0.42] },
          ar: [[0.42, 0.90, 0.60, 0.16]], zn: [0.52, 0.0, 0.48, 0.30], hi: ['hRM']
        },
        {
          t: '传中 / 倒三角', d: '下底之后有两个选择：后点高球，或者回敲禁区弧顶。', b: [0.86, 0.16],
          mv: { RM: [0.87, 0.17], RB: [0.80, 0.82], ST1: [0.80, 0.46], ST2: [0.80, 0.56], CM1: [0.76, 0.34], LM: [0.88, 0.30] },
          ar: [[0.62, 0.14, 0.86, 0.16], [0.86, 0.18, 0.80, 0.52]]
        },
        {
          t: '后点包抄', d: '远端的边锋冲进后点——传中时，禁区里永远要有三个人。', b: [0.84, 0.42],
          mv: { LM: [0.88, 0.36], ST1: [0.84, 0.44], ST2: [0.86, 0.56], CM2: [0.82, 0.60], RM: [0.80, 0.20] },
          ar: [[0.86, 0.20, 0.84, 0.42]], hi: ['hLM']
        },
        {
          t: '终结', d: '后点一对一，头球或直接扫射；丢球后立刻有两人准备第二落点。', b: [0.92, 0.40],
          mv: { LM: [0.93, 0.38], ST1: [0.90, 0.48], CM2: [0.88, 0.62] },
          ar: [[0.88, 0.38, 0.93, 0.39]]
        }
      ]
    },
    {
      id: 'positional', num: '05', name: '传控足球', en: 'POSITIONAL PLAY', page: '12',
      quote: '善战者，致人而不致于人。',
      who: '瓜迪奥拉 · 巴塞罗那 2008–2012',
      note: '单后腰 + 两个肋部 + 伪九号：控球是为了让对手移动，然后打他离开的位置',
      home: [
        ['GK', 1, 0.05, 0.50], ['LB', 22, 0.22, 0.14], ['CB1', 3, 0.18, 0.38], ['CB2', 5, 0.18, 0.62],
        ['RB', 2, 0.22, 0.86], ['DM', 16, 0.34, 0.50, '布斯克茨'], ['CM1', 6, 0.44, 0.30, '哈维'],
        ['CM2', 8, 0.44, 0.70, '伊涅斯塔'], ['LW', 17, 0.62, 0.12], ['RW', 7, 0.62, 0.88],
        ['ST', 10, 0.66, 0.50, '梅西']
      ],
      away: [
        ['GK', 1, 0.94, 0.50], ['LB', 12, 0.74, 0.16], ['CB1', 15, 0.78, 0.38], ['CB2', 16, 0.78, 0.62],
        ['RB', 13, 0.74, 0.84], ['LM', 11, 0.64, 0.18], ['CM1', 6, 0.66, 0.42], ['CM2', 8, 0.66, 0.58],
        ['RM', 7, 0.64, 0.82], ['ST1', 9, 0.52, 0.44], ['ST2', 10, 0.52, 0.56]
      ],
      frames: [
        { t: '结构', d: '4-3-3：一个单后腰、两个肋部、一个伪九号。位置是建议，空间才是指令。', b: [0.10, 0.40] },
        {
          t: '单后腰回撤', d: '两名中卫拉开，布斯克茨回撤到他们之间——出球永远有第三人。', b: [0.25, 0.50],
          mv: { CB1: [0.14, 0.34], CB2: [0.14, 0.66], DM: [0.25, 0.50], LB: [0.20, 0.12], RB: [0.20, 0.88] },
          ar: [[0.10, 0.40, 0.25, 0.48]], hi: ['hDM']
        },
        {
          t: '肋部接球', d: '球进到哈维脚下：他站的位置，正好是对手中场线和中卫线之间。', b: [0.71, 0.29],
          mv: { CM1: [0.71, 0.30], CM2: [0.62, 0.64], ST: [0.68, 0.44], DM: [0.44, 0.46], RW: [0.72, 0.86] },
          ar: [[0.25, 0.50, 0.69, 0.32]], hi: ['hCM1']
        },
        {
          t: '伪九号', d: '梅西回撤，把一名中卫拉出防线；两条边线同时启动，跑向中卫身后的空间。', b: [0.67, 0.45],
          mv: { ST: [0.66, 0.46], LW: [0.80, 0.18], RW: [0.82, 0.76], CM2: [0.62, 0.60], 'aCB1': [0.73, 0.46] },
          ar: [[0.71, 0.31, 0.67, 0.44], [0.72, 0.50, 0.80, 0.20]]
        },
        {
          t: '第三人跑动', d: '真正的杀招是断球后的三到五秒：直塞身后，边锋单刀。', b: [0.90, 0.73],
          mv: { RW: [0.91, 0.73], ST: [0.72, 0.50], CM1: [0.80, 0.36], LW: [0.82, 0.22] },
          ar: [[0.67, 0.45, 0.90, 0.72]], hi: ['hRW']
        }
      ]
    },
    {
      id: 'press', num: '06', name: '高位压迫', en: 'HIGH PRESS', page: '18',
      quote: '故善战者，求之于势，不责于人。',
      who: '克洛普 · 五秒反抢 ／ 路易斯·恩里克 · 控球后猎杀',
      note: '压迫不是防守，是进攻的第一步；代价是体能和负荷',
      home: [
        ['GK', 1, 0.06, 0.50], ['LB', 3, 0.30, 0.16], ['CB1', 4, 0.34, 0.38], ['CB2', 5, 0.34, 0.62],
        ['RB', 2, 0.30, 0.84], ['DM', 6, 0.48, 0.50], ['CM1', 8, 0.50, 0.30], ['CM2', 10, 0.50, 0.70],
        ['LW', 11, 0.66, 0.14], ['RW', 7, 0.66, 0.86], ['ST', 9, 0.74, 0.50]
      ],
      away: [
        ['GK', 1, 0.94, 0.50], ['LB', 12, 0.82, 0.16], ['CB1', 15, 0.86, 0.38], ['CB2', 16, 0.86, 0.62],
        ['RB', 13, 0.82, 0.84], ['DM1', 6, 0.72, 0.42], ['DM2', 8, 0.72, 0.58], ['LW', 11, 0.60, 0.16],
        ['AM', 10, 0.62, 0.50], ['RW', 7, 0.60, 0.84], ['ST', 9, 0.42, 0.50]
      ],
      frames: [
        { t: '起手', d: '前锋站在两名中卫之间的阴影里，等一个信号——不是等球，是等错误。', b: [0.86, 0.38] },
        {
          t: '触发', d: '回传门将 / 停球过大 / 球到边后卫：三个开关，任意一个打开就压。', b: [0.93, 0.50],
          mv: { ST: [0.90, 0.46], LW: [0.80, 0.18], RW: [0.80, 0.82], CM1: [0.74, 0.34], CM2: [0.72, 0.66] },
          ar: [[0.74, 0.50, 0.90, 0.48]], hi: ['hST']
        },
        {
          t: '合围', d: '前锋逼中卫、中场跳上中路、边锋封住边线：把球困在边路，做成一打一的陷阱。', b: [0.85, 0.15],
          mv: { ST: [0.87, 0.30], LW: [0.86, 0.10], CM1: [0.80, 0.20], CM2: [0.76, 0.52], DM: [0.62, 0.46], CB1: [0.52, 0.38] },
          ar: [[0.90, 0.46, 0.86, 0.15]], zn: [0.72, 0.0, 0.28, 0.30]
        },
        {
          t: '五秒反抢', d: '就地反抢成功，第一脚传球直接打身后——反抢就是助攻。', b: [0.70, 0.24],
          mv: { LW: [0.72, 0.20], ST: [0.80, 0.40], CM1: [0.74, 0.28], CM2: [0.72, 0.52] },
          ar: [[0.86, 0.15, 0.72, 0.22]], hi: ['hLW']
        },
        {
          t: '反抢即进攻', d: '抢断后 5 秒内完成射门：压上去的地方，就是最好的进攻起点。', b: [0.90, 0.44],
          mv: { ST: [0.90, 0.44], LW: [0.82, 0.24], CM1: [0.82, 0.36] },
          ar: [[0.80, 0.40, 0.90, 0.44]]
        }
      ]
    }
  ];

  /* ---------------- SVG 工具 ---------------- */
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------------- 状态 ---------------- */
  var state = {
    ti: 0, fi: 0, playing: true, speed: 1, segStart: 0, raf: 0,
    nodes: {}, anno: null, lastBall: null
  };
  var DUR_MOVE = 1000, DUR_HOLD = 1300, DUR_FIRST = 1500;

  function T() { return TACTICS[state.ti]; }
  function frames() { return T().frames; }

  function fmtTip() { return T().frames[state.fi]; }

  /* 累积计算第 i 帧的站位：初始站位 + 0..i 帧的 mv */
  function resolve(i) {
    var pos = {};
    T().home.forEach(function (p) { pos['h' + p[0]] = [p[2], p[3]]; });
    T().away.forEach(function (p) { pos['a' + p[0]] = [p[2], p[3]]; });
    for (var j = 0; j <= i; j++) {
      var mv = T().frames[j].mv;
      if (mv) for (var k in mv) if (mv.hasOwnProperty(k)) {
        var key = pos[k] ? k : (pos['h' + k] ? 'h' + k : 'a' + k);
        if (pos[key]) pos[key] = mv[k];
      }
    }
    return pos;
  }

  /* ---------------- 球场 ---------------- */
  function buildPitch(svg) {
    var g = el('g', { 'class': 'pitch' }, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: '#0b3327' }, g);
    // 草皮条纹
    for (var i = 0; i < 10; i++) {
      el('rect', {
        x: PAD + i * IW / 10, y: PAD, width: IW / 10, height: IH,
        fill: i % 2 ? '#0d3a2b' : '#0f4030'
      }, g);
    }
    var line = function (x1, y1, x2, y2, op) {
      el('line', { x1: px(x1), y1: py(y1), x2: px(x2), y2: py(y2), stroke: '#ffffff', 'stroke-opacity': op || 0.5, 'stroke-width': 2 }, g);
    };
    // 边线 / 中线
    el('rect', { x: px(0), y: py(0), width: IW, height: IH, fill: 'none', stroke: '#fff', 'stroke-opacity': .55, 'stroke-width': 2.5 }, g);
    line(0.5, 0, 0.5, 1, .45);
    // 中圈
    el('circle', { cx: px(.5), cy: py(.5), r: 0.0871 * IW, fill: 'none', stroke: '#fff', 'stroke-opacity': .45, 'stroke-width': 2 }, g);
    el('circle', { cx: px(.5), cy: py(.5), r: 4, fill: '#fff', 'fill-opacity': .8 }, g);
    // 禁区 / 小禁区 / 罚球点（两侧）
    [0, 1].forEach(function (side) {
      var dir = side === 1 ? -1 : 1;
      var bx = side === 1 ? 1 - 0.157 : 0;
      el('rect', { x: px(bx), y: py(0.2037), width: 0.157 * IW, height: 0.5926 * IH, fill: 'none', stroke: '#fff', 'stroke-opacity': .5, 'stroke-width': 2 }, g);
      var gx = side === 1 ? 1 - 0.0524 : 0;
      el('rect', { x: px(gx), y: py(0.3653), width: 0.0524 * IW, height: 0.2694 * IH, fill: 'none', stroke: '#fff', 'stroke-opacity': .45, 'stroke-width': 2 }, g);
      var spot = side === 1 ? 1 - 0.1048 : 0.1048;
      el('circle', { cx: px(spot), cy: py(.5), r: 3.5, fill: '#fff', 'fill-opacity': .8 }, g);
      // 球门
      el('rect', { x: side === 1 ? W - PAD : PAD - 12, y: py(0.44), width: 12, height: 0.12 * IH, fill: '#e8f4ee', 'fill-opacity': .35, stroke: '#fff', 'stroke-opacity': .5 }, g);
      // 禁区弧（以罚球点为圆心，半径 9.15m，只画禁区线外的部分）
      var r = 0.0871 * IW;
      var yTop = 0.5 - Math.sqrt(Math.pow(9.15 / 68, 2) - Math.pow(5.5 / 68, 2));
      var yBot = 0.5 + Math.sqrt(Math.pow(9.15 / 68, 2) - Math.pow(5.5 / 68, 2));
      var edge = side === 1 ? 1 - 0.157 : 0.157;
      el('path', {
        d: 'M ' + px(edge) + ' ' + py(yTop) +
           ' A ' + r + ' ' + r + ' 0 0 ' + (side === 1 ? 1 : 0) + ' ' +
           px(edge) + ' ' + py(yBot),
        fill: 'none', stroke: '#fff', 'stroke-opacity': .4, 'stroke-width': 2
      }, g);
    });
    // 中圈半弧装饰
    return g;
  }

  /* ---------------- 渲染 ---------------- */
  function makePlayers(svg) {
    var g = el('g', { 'class': 'players' }, svg);
    var mk = function (p, team) {
      var key = team + p[0];
      var g2 = el('g', { 'class': 'pl ' + (team === 'h' ? 'home' : 'away'), 'data-k': key }, g);
      el('circle', { r: 12, 'class': 'pl-dot' }, g2);
      var tx = el('text', { 'class': 'pl-num', 'text-anchor': 'middle', dy: '4' }, g2);
      tx.textContent = String(p[1]);
      if (p[4]) {
        var nm = el('text', { 'class': 'pl-name', 'text-anchor': 'middle', dy: '26' }, g2);
        nm.textContent = p[4];
      }
      state.nodes[key] = g2;
    };
    T().home.forEach(function (p) { mk(p, 'h'); });
    T().away.forEach(function (p) { mk(p, 'a'); });
    var ball = el('g', { 'class': 'ball' }, svg);
    el('circle', { r: 8, fill: '#fff', stroke: '#11271f', 'stroke-width': 2.5 }, ball);
    el('circle', { r: 2.5, fill: '#11271f' }, ball);
    state.nodes.ball = ball;
    state.anno = el('g', { 'class': 'anno' }, svg);
  }

  function drawFrameAnnotations(f, p) {
    var g = state.anno;
    while (g.firstChild) g.removeChild(g.firstChild);
    var op = clamp(p * 1.6, 0, 1);
    if (f.zn) {
      el('rect', {
        x: px(f.zn[0]), y: py(f.zn[1]), width: f.zn[2] * IW, height: f.zn[3] * IH,
        fill: 'rgba(255,209,102,0.10)', stroke: 'rgba(255,209,102,0.55)', 'stroke-width': 2,
        'stroke-dasharray': '8 7', rx: 8, opacity: op
      }, g);
    }
    (f.ar || []).forEach(function (a) {
      var x1 = px(a[0]), y1 = py(a[1]), x2 = px(a[2]), y2 = py(a[3]);
      el('line', {
        x1: x1, y1: y1, x2: x2, y2: y2, stroke: '#ffd166', 'stroke-width': 3,
        'stroke-dasharray': '9 7', 'stroke-linecap': 'round', opacity: op * 0.95,
        'marker-end': 'url(#arrow)'
      }, g);
    });
  }

  function render(now) {
    var f = fmtTip();
    var pos, ball, p = 1;
    if (state.fi === 0) {
      pos = resolve(0);
      ball = f.b;
    } else {
      var span = DUR_MOVE / state.speed;
      p = clamp((now - state.segStart) / span, 0, 1);
      var e = ease(p);
      var from = resolve(state.fi - 1), to = resolve(state.fi);
      pos = {};
      for (var k in to) if (to.hasOwnProperty(k)) {
        var a = from[k] || to[k];
        pos[k] = [lerp(a[0], to[k][0], e), lerp(a[1], to[k][1], e)];
      }
      var b0 = frames()[state.fi - 1].b, b1 = f.b;
      ball = [lerp(b0[0], b1[0], e), lerp(b0[1], b1[1], e)];
    }
    for (var key in state.nodes) if (state.nodes.hasOwnProperty(key) && key !== 'ball') {
      var n = state.nodes[key];
      if (pos[key]) n.setAttribute('transform', 'translate(' + px(pos[key][0]).toFixed(2) + ',' + py(pos[key][1]).toFixed(2) + ')');
    }
    state.nodes.ball.setAttribute('transform', 'translate(' + px(ball[0]).toFixed(2) + ',' + py(ball[1]).toFixed(2) + ')');
    // 高亮
    var his = f.hi || [];
    Object.keys(state.nodes).forEach(function (key) {
      if (key === 'ball') return;
      var on = his.indexOf(key) > -1;
      state.nodes[key].classList.toggle('hi', on && p > 0.35);
    });
    drawFrameAnnotations(f, p);
  }

  /* ---------------- 播放控制 ---------------- */
  function frameLen(i) { return (i === 0 ? DUR_FIRST : DUR_MOVE + DUR_HOLD) / state.speed; }

  function tick(now) {
    if (!state.playing) return;
    if (!state.raf) state.segStart = now;
    render(now);
    if (now - state.segStart >= frameLen(state.fi)) {
      if (state.fi < frames().length - 1) {
        state.fi++;
        state.segStart = now;
        updateUI();
      } else {
        state.playing = false;
        updateButtons();
        return;
      }
    }
    state.raf = requestAnimationFrame(tick);
  }

  function play() {
    if (state.playing) return;
    state.playing = true;
    state.raf = 0;
    state.segStart = 0;
    updateButtons();
    requestAnimationFrame(tick);
  }
  function pause() {
    state.playing = false;
    state.raf = 0;
    updateButtons();
  }
  function jump(i) {
    state.fi = clamp(i, 0, frames().length - 1);
    state.segStart = 0;
    state.raf = 0;
    if (state.playing) requestAnimationFrame(tick); else render(performance.now());
    updateUI();
  }

  /* ---------------- UI ---------------- */
  function updateUI() {
    var t = T(), f = fmtTip();
    $('tac-name').textContent = t.num + '  ' + t.name;
    $('tac-en').textContent = t.en;
    $('step-title').textContent = f.t;
    $('step-text').textContent = f.d;
    $('step-count').textContent = (state.fi + 1) + ' / ' + frames().length;
    var ol = $('tac-steps');
    ol.innerHTML = '';
    frames().forEach(function (fr, i) {
      var li = document.createElement('li');
      li.className = 'tstep' + (i === state.fi ? ' on' : '');
      li.textContent = fr.t;
      li.onclick = function () { jump(i); };
      ol.appendChild(li);
    });
    $('tac-quote').textContent = '「' + t.quote + '」';
    $('tac-who').textContent = t.who;
    $('tac-note').textContent = t.note;
    $('tac-page').textContent = '来源：Football Tactics Club 招新 PPT · 第 ' + t.page + ' 页';
    document.querySelectorAll('.tchip').forEach(function (b, i) {
      b.classList.toggle('on', i === state.ti);
    });
    updateButtons();
  }
  function updateButtons() {
    $('btn-play').textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
    $('btn-play').classList.toggle('on', state.playing);
  }

  function loadTactic(i) {
    state.ti = clamp(i, 0, TACTICS.length - 1);
    state.fi = 0;
    state.playing = true;
    state.segStart = 0;
    state.raf = 0;
    state.nodes = {};
    var svg = $('pitch');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // 箭头 marker 定义
    var defs = el('defs', {}, svg);
    var m = el('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: '#ffd166' }, m);
    buildPitch(svg);
    makePlayers(svg);
    var hash = T().id;
    if (history.replaceState) history.replaceState(null, '', '?t=' + hash);
    updateUI();
    render(performance.now());
    requestAnimationFrame(tick);
  }

  function init() {
    var chips = $('tac-chips');
    TACTICS.forEach(function (t, i) {
      var b = document.createElement('button');
      b.className = 'tchip';
      b.innerHTML = '<span class="tchip-num">' + t.num + '</span><span class="tchip-name">' + t.name + '</span><span class="tchip-en">' + t.en + '</span>';
      b.onclick = function () { loadTactic(i); };
      chips.appendChild(b);
    });
    $('btn-play').onclick = function () { state.playing ? pause() : play(); };
    $('btn-prev').onclick = function () { jump(state.fi - 1); };
    $('btn-next').onclick = function () { jump(state.fi + 1); };
    $('btn-restart').onclick = function () { jump(0); play(); };
    $('btn-speed').onclick = function () {
      state.speed = state.speed >= 1.6 ? 0.6 : state.speed >= 1 ? 1.6 : 1;
      this.textContent = state.speed + '×';
      state.segStart = 0; state.raf = 0;
    };
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space') { e.preventDefault(); state.playing ? pause() : play(); }
      if (e.code === 'ArrowRight') jump(state.fi + 1);
      if (e.code === 'ArrowLeft') jump(state.fi - 1);
    });
    var want = (location.search.match(/[?&]t=([\w-]+)/) || [])[1] || 'counter';
    var idx = TACTICS.findIndex(function (t) { return t.id === want; });
    loadTactic(idx < 0 ? 0 : idx);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
