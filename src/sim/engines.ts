/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimState, Country, Company, Market, CryptoChain, HedgeFund, InfluenceNode, DynastyMember, TraumaLog, CableLog } from '../types';

export class GeopoliticalOmegaEngine {
  
  static tick(state: SimState): SimState {
    // Increment Tick
    state.currentTick++;
    
    // Increment Date calendar by 1 week
    const currentCalendar = new Date(state.date);
    currentCalendar.setDate(currentCalendar.getDate() + 7);
    state.date = currentCalendar.toISOString().split('T')[0];

    // 1. Run Geopolitical & Demographics Engine (unrest, inflation, GDP growth)
    state = this.tickGeopolitics(state);

    // 2. Run Market Order Books (including Pattern-Hunting Wolves frontrunning / liquidation)
    state = this.tickMarkets(state);

    // 3. Run Corporate Simulation (costs, inputs, Layoffs & Unrest coupling)
    state = this.tickCorporates(state);

    // 4. Run Crypto & DeFi Flows (DEX pools, validator status, bank runs)
    state = this.tickCrypto(state);

    // 5. Run Shadow Networks, Espionage & Bribes
    state = this.tickInfluence(state);

    // 6. Run Dynasty aging, prestige, and Genetic optimization Checks
    state = this.tickDynasty(state);

    // 7. Global Macro Solvency check
    state = this.tickGlobalSolvency(state);

    return state;
  }

  // --- I. GEOPOLITICAL & DEMOGRAPHICS: HELL-LOOP RECURSION ---
  private static tickGeopolitics(state: SimState): SimState {
    const defaultDateString = state.date;

    Object.values(state.countries).forEach((c: Country) => {
      // Look up captured fractional lobbying (from influence nodes)
      const relativeNode = state.influenceNodes.find(n => n.type === 'Lobby' && n.nation === c.id);
      if (relativeNode) {
        c.capturedLobbyFraction = relativeNode.playerControlWeight / 100;
      }

      // Macro-Financial feedback loop step: High corporate layoffs trigger national unrest
      const relatedCompanies = state.companies.filter(corp => corp.country === c.id);
      const totalLayoffsFactor = relatedCompanies.reduce((acc, curr) => acc + curr.layoffsPercentage, 0);

      if (totalLayoffsFactor > 0.05) {
        // Layoff spillover -> Unrest spikes
        c.unrest = Math.min(100, c.unrest + totalLayoffsFactor * 12);
        c.stability = Math.max(0, c.stability - totalLayoffsFactor * 8);
        
        if (state.currentTick % 12 === 0) {
          state.cables.push({
            time: `${defaultDateString} 13:00:00`,
            source: 'DEPT_LABOUR',
            message: `MASS UNREST: Layoffs in ${c.name} trigger protest columns in capital coordinates. Citizens occupy financial centers.`,
            classification: 'SECRET'
          });
        }
      }

      // Inflation perception triggers bank runs and pushes unrest up
      const interestRateDelta = c.interestRate - 0.04;
      const targetInflation = Math.max(-0.02, 0.02 + (c.unrest * 0.001) - interestRateDelta * 0.5);
      c.inflation += (targetInflation - c.inflation) * 0.1;

      // Unrest forces Risk Premium Spike -> Sovereign Bond Yields Rise!
      // This is a core mechanics element of the "Hell-Loop"
      const debtToGdp = c.bondsIssued / (c.gdp || 1);
      const riskPremiumFactor = (c.unrest / 100) * 0.08 + (debtToGdp - 0.5) * 0.04;
      const sovereignYield = c.interestRate + Math.max(0, riskPremiumFactor);

      // Print warning on yields spike
      if (sovereignYield > 0.12 && state.currentTick % 26 === 0) {
        state.cables.push({
          time: `${defaultDateString} 14:15:00`,
          source: 'BOND_CLEARING',
          message: `DANGER: Sovereign risk of ${c.id} entering contagion zone. Bond yields spike to ${(sovereignYield * 100).toFixed(2)}%. Sovereign debt holding values crashing.`,
          classification: 'TOP_SECRET'
        });

        // Log permanent world trauma on debt defaults
        if (sovereignYield > 0.18 && !state.traumaLog.some(t => t.description.includes(`${c.id} sovereign default`))) {
          state.traumaLog.push({
            id: Math.random().toString(),
            tick: state.currentTick,
            date: state.date,
            eventType: 'WAR',
            description: `${c.id} sovereign default triggers global secondary credit shock. Safe-haven assets re-rating.`,
            severity: 8
          });
          state.globalStability = Math.max(0, state.globalStability - 15);
        }
      }

      // CENTRAL BANK PUPPETRY & THE PRINTING PRESS
      // If Captured lobby is >= 80% (0.80), unlock printing press and let player set rate and print money directly
      if (c.centralBank.printingPressOverride) {
        // Player overrides the Central Bank
        // Triggers massive inflation and drains GDP to feed back into corporate reserves
        c.gdp = Math.max(1e10, c.gdp * 0.99); // Cannibalize 1% GDP per tick!
        c.inflation = Math.min(1.0, c.inflation + 0.02); // Hyper-inflation
        c.unrest = Math.min(100, c.unrest + 4);
        c.stability = Math.max(0, c.stability - 3);

        // Every tick of printing press injects player cash flow!
        state.player.cash += 5000000000; // Directly injects $5B cash per tick into player accounts!
        c.moneySupply += 12000000000; // Bloat central bank supply

        if (state.currentTick % 8 === 0) {
          state.cables.push({
            time: `${defaultDateString} 08:30:00`,
            source: 'CENTRAL_BANK',
            message: `PUPPET PRESS: Direct Monetization of ${c.id} active. Cannibalizing national budget. $5,000,000,000 transferred to Dynastic cash pools.`,
            classification: 'EYES_ONLY'
          });
        }
      } else {
        // Normal automated central bank Taylor Rule behavior
        const inflationGap = c.inflation - 0.02;
        const unemploymentGap = 0.04 - c.unemployment;
        const targetRate = Math.max(0.0025, 0.02 + 1.5 * inflationGap + 0.5 * unemploymentGap);
        c.centralBank.rate += (targetRate - c.centralBank.rate) * 0.08;
        c.interestRate = c.centralBank.rate;
      }

      // Normal GDP updates
      const laborProductivityLoss = (c.unrest / 100) * 0.04;
      c.gdpGrowth = Math.max(-0.15, 0.035 - laborProductivityLoss - (c.interestRate * 0.2));
      c.gdp = Math.max(1e10, c.gdp * (1 + c.gdpGrowth / 52));
    });

    return state;
  }

  // --- II. MARKET ENGINE: PREDATORY AGENT-AI "WOLVES FIGHT" ---
  private static tickMarkets(state: SimState): SimState {
    const dateStr = state.date;

    Object.values(state.markets).forEach((market: Market) => {
      // 1. NPC Predatory Wolves: front-run and Stop-Loss Hunt the player
      // Check if player has placed bid/ask order book density
      const playerBidsTotal = market.orderBook.bids.filter(o => o.owner === 'player_dynasty');
      const playerAsksTotal = market.orderBook.asks.filter(o => o.owner === 'player_dynasty');

      // Citadels / Blackstone ("Pattern-Hunting Wolves") look for player's sizes
      state.hedgeFunds.forEach((fund: HedgeFund) => {
        if (fund.isWolf) {
          // If player has large buy bounds, frontrun by bidding 0.01 higher
          if (playerBidsTotal.length > 0) {
            const playerMaxBid = Math.max(...playerBidsTotal.map(o => o.price));
            const fontRunPrice = playerMaxBid + 0.02;

            // Wolf front-runs the player
            market.orderBook.bids.push({
              id: Math.random().toString(),
              side: 'buy',
              price: fontRunPrice,
              quantity: Math.floor(Math.random() * 20000 + 5000),
              owner: fund.id,
              timestamp: Date.now()
            });

            if (state.currentTick % 20 === 0 && fund.dynastyEnemy) {
              state.cables.push({
                time: `${dateStr} 15:45:10`,
                source: 'DARK_POOL_MONITOR',
                message: `ALERT: Predator Fund ${fund.name} frontrunning your bids on ${market.ticker}. Squeezing order book margin.`,
                classification: 'SECRET'
              });
            }
          }

          // Stop-loss hunting behavior: If player has leveraged securities or large buys,
          // the predatory fund places an aggressive block sell at low support levels to push price down and trigger panic liquidation
          if (fund.dynastyEnemy && Math.random() < 0.10) {
            const supportLevel = market.currentPrice * 0.94;
            market.orderBook.asks.push({
              id: Math.random().toString(),
              side: 'sell',
              price: supportLevel,
              quantity: Math.floor(Math.random() * 50000 + 10000),
              owner: fund.id,
              timestamp: Date.now()
            });

            if (state.currentTick % 26 === 0) {
              state.cables.push({
                time: `${dateStr} 16:01:00`,
                source: 'LIQUIDITY_DESK',
                message: `URGENT: Block dump of ${market.ticker} by hostile fund Scythe Quant. Stop-Loss Hunt triggered inside dark books.`,
                classification: 'TOP_SECRET'
              });
            }
          }
        }
      });

      // Maintain sorting order
      market.orderBook.bids.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
      market.orderBook.asks.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);

      // Match orders
      let tradeMatched = false;
      let matchedPrice = market.currentPrice;
      let totalVolume = 0;

      while (
        market.orderBook.bids.length > 0 &&
        market.orderBook.asks.length > 0 &&
        market.orderBook.bids[0].price >= market.orderBook.asks[0].price
      ) {
        const bid = market.orderBook.bids[0];
        const ask = market.orderBook.asks[0];
        const exePrice = (bid.price + ask.price) / 2;
        const volume = Math.min(bid.quantity, ask.quantity);

        // Process Settlements
        this.settleTrade(state, market.ticker, bid.owner, ask.owner, exePrice, volume);

        bid.quantity -= volume;
        ask.quantity -= volume;
        totalVolume += volume;
        matchedPrice = exePrice;
        tradeMatched = true;

        if (bid.quantity <= 0) market.orderBook.bids.shift();
        if (ask.quantity <= 0) market.orderBook.asks.shift();
      }

      if (tradeMatched) {
        market.currentPrice = matchedPrice;
      } else {
        // Moderate random fluctuation drift
        const bidVolSum = market.orderBook.bids.reduce((sum, o) => sum + o.quantity, 0);
        const askVolSum = market.orderBook.asks.reduce((sum, o) => sum + o.quantity, 0);
        const imbalance = (bidVolSum - askVolSum) / (bidVolSum + askVolSum || 1);
        const drift = imbalance * 0.003 * market.currentPrice;
        market.currentPrice = Math.max(0.1, market.currentPrice + drift + (Math.random() - 0.5) * (market.currentPrice * 0.01));
      }

      // Add To Graphic Candle History
      const lastHist = market.history[market.history.length - 1];
      const nextOpen = lastHist ? lastHist.close : market.currentPrice;
      const nextClose = market.currentPrice;
      const nextHigh = Math.max(nextOpen, nextClose) + (Math.random() * (market.currentPrice * 0.01));
      const nextLow = Math.max(0.01, Math.min(nextOpen, nextClose) - (Math.random() * (market.currentPrice * 0.01)));

      market.history.push({
        open: nextOpen,
        high: nextHigh,
        low: nextLow,
        close: nextClose,
        volume: totalVolume > 0 ? totalVolume : Math.floor(Math.random() * 100000 + 10000),
        date: state.date
      });

      if (market.history.length > 120) {
        market.history.shift();
      }
    });

    return state;
  }

  private static settleTrade(state: SimState, ticker: string, buyer: string, seller: string, price: number, qty: number) {
    const totalCost = price * qty;

    // Direct settlements
    // Buyer Cash Flow debit
    if (buyer === 'player_dynasty') {
      state.player.cash -= totalCost;
      state.player.assets.stocks[ticker] = (state.player.assets.stocks[ticker] || 0) + qty;
    } else {
      const bFund = state.hedgeFunds.find(f => f.id === buyer);
      if (bFund) {
        bFund.cash -= totalCost;
        bFund.positions[ticker] = (bFund.positions[ticker] || 0) + qty;
      }
    }

    // Seller Cash Flow credit
    if (seller === 'player_dynasty') {
      state.player.cash += totalCost;
      state.player.assets.stocks[ticker] = Math.max(0, (state.player.assets.stocks[ticker] || 0) - qty);
    } else {
      const sFund = state.hedgeFunds.find(f => f.id === seller);
      if (sFund) {
        sFund.cash += totalCost;
        sFund.positions[ticker] = Math.max(0, (sFund.positions[ticker] || 0) - qty);
      }
    }
  }

  // --- III. CORPORATE TICKER ENGINE: COSTS & REVENUE & LAYOFF CASCADE ---
  private static tickCorporates(state: SimState): SimState {
    state.companies.forEach((corp: Company) => {
      const c = state.countries[corp.country];
      const interestRate = c ? c.interestRate : 0.04;
      const taxRate = c ? c.taxRates.corporate : 0.21;

      // 1. Calculate Revenue (driven by economic demand & industry specific coefficients)
      const economyMultiplier = c ? (1 + c.gdpGrowth * 2) : 1.0;
      const demandBase = 450000000 / 52;
      
      const techProgressFactor = state.traumaLog.filter(l => l.eventType === 'EUGENICS_EXP').length * 0.15 + 1.0;

      let industryCoefficient = 1.0;
      if (corp.industry === 'AI') industryCoefficient = 1.6 * techProgressFactor;
      if (corp.industry === 'Energy') industryCoefficient = 1.1;
      if (corp.industry === 'Defense') industryCoefficient = state.globalStability < 50 ? 2.5 : 1.2;
      if (corp.industry === 'Healthcare') industryCoefficient = state.globalSuffering > 50 ? 2.2 : 1.1;

      const weeklyRevenue = demandBase * industryCoefficient * economyMultiplier * (0.95 + Math.random() * 0.1);
      
      // Expenses / Overhead
      const workforceCapacity = 1.0 - corp.layoffsPercentage;
      const standardWageBill = (corp.sharesOutstanding * 0.005) * workforceCapacity / 52;
      const productionCosts = weeklyRevenue * 0.40;
      const sovereignInterestCosts = corp.debt * (interestRate / 52);

      const totalExpenses = standardWageBill + productionCosts + sovereignInterestCosts;

      corp.revenue = weeklyRevenue * 52;
      corp.expenses = totalExpenses * 52;
      corp.profit = corp.revenue - corp.expenses;

      const netEarnings = weeklyRevenue - totalExpenses;
      const taxPaid = netEarnings > 0 ? netEarnings * taxRate : 0;
      const weeklyCashFlow = netEarnings - taxPaid;

      corp.cash += weeklyCashFlow;

      // Restructure Restraints
      if (corp.cash < 0) {
        const fundingInjected = Math.abs(corp.cash);
        corp.debt += fundingInjected;
        corp.cash = 1000000; // micro liquidity reserve

        // Check Restructuring default bankruptcy trigger
        if (corp.debt > (corp.sharesOutstanding * corp.sharePrice) * 2.0) {
          corp.debt = corp.debt * 0.4; // restruct haircuts
          corp.cash = 5000000;
          corp.shareholders = {
            'creditor_restruct': Math.floor(corp.sharesOutstanding * 0.90),
            'retail_public': Math.floor(corp.sharesOutstanding * 0.10)
          };
          if (state.markets[corp.ticker]) {
            state.markets[corp.ticker].currentPrice = Math.max(0.01, state.markets[corp.ticker].currentPrice * 0.08);
          }
          state.cables.push({
            time: `${state.date} 09:12:00`,
            source: 'DEBT_COURT',
            message: `BANKRUPTCY Restructuring: ${corp.name} restructures balance sheet. Dynastic holdings heavily diluted!`,
            classification: 'EYES_ONLY'
          });
        }
      }

      // Board representation updating based on shareholder holdings
      const playerSharesOwned = state.player.assets.stocks[corp.ticker] || 0;
      const playerPercentOwned = playerSharesOwned / corp.sharesOutstanding;

      if (playerPercentOwned >= 0.51) {
        corp.board[0].owner = 'Dynasty Control';
        corp.board[1].owner = 'Dynasty Control';
        corp.board[2].owner = 'Dynasty Control';
      } else if (playerPercentOwned >= 0.25) {
        corp.board[0].owner = 'Dynasty Representative';
        corp.board[1].owner = 'Dynasty Representative';
        corp.board[2].owner = 'Institutional Syndicate';
      } else {
        corp.board[0].owner = 'Founders';
        corp.board[1].owner = 'Institutional Syndicate';
        corp.board[2].owner = 'Retail Float';
      }

      // Distribute Dividends to holders
      if (corp.cash > corp.debt * 0.4 && corp.profit > 0) {
        const dividendAggregate = (corp.profit * 0.35) / 52;
        corp.cash -= dividendAggregate;

        // Player share Payout receipt
        if (playerPercentOwned > 0) {
          state.player.cash += dividendAggregate * playerPercentOwned;
        }

        // Wolves payouts
        state.hedgeFunds.forEach(f => {
          const fundShares = f.positions[corp.ticker] || 0;
          if (fundShares > 0) {
            f.cash += dividendAggregate * (fundShares / corp.sharesOutstanding);
          }
        });
      }
    });

    return state;
  }

  // --- IV. CRYPTO & DEFI NETWORKS: BLOCK-CHAIN BANK RUN COUPLING ---
  private static tickCrypto(state: SimState): SimState {
    Object.values(state.cryptoChains).forEach((chain: CryptoChain) => {
      // Impact of national rates
      const usRate = state.countries['US']?.interestRate || 0.045;
      
      const userTrend = (0.02 - usRate) * 1.5; // High interest dragging TVL down
      const activeFlux = Math.random() < 0.20 ? (Math.random() - 0.5) * 50000 : 0;

      chain.activeUsers = Math.max(1000, Math.floor(chain.activeUsers * (1 + userTrend / 52) + activeFlux));

      if (chain.bankRunTriggered) {
        // High cognitive warfare bomb detonated!
        chain.tvl = Math.max(10000000, chain.tvl * 0.75); // rapid drop by 25% each week
        chain.validators = Math.max(5, Math.floor(chain.validators * 0.85));
        
        const cMarket = state.markets[chain.ticker];
        if (cMarket) {
          cMarket.currentPrice = Math.max(0.01, cMarket.currentPrice * 0.82);
        }
      } else {
        // Normal state
        const liquiditySaturate = chain.activeUsers * 1000;
        chain.tvl += (liquiditySaturate - chain.tvl) * 0.05;
        
        const cMarket = state.markets[chain.ticker];
        if (cMarket) {
          const ratioVal = chain.tvl / 1e10; // TVL relative density metric
          cMarket.currentPrice += (ratioVal * 400 - cMarket.currentPrice) * 0.02;
        }
      }

      chain.tokenPrice = state.markets[chain.ticker]?.currentPrice || 0.1;
    });

    return state;
  }

  // --- V. SHADOW NETWORKS: REGULATORY CONCESSIONS ---
  private static tickInfluence(state: SimState): SimState {
    const defaultDate = state.date;

    state.influenceNodes.forEach((node: InfluenceNode) => {
      // Natural decay of influence if no direct maintenance is sponsored
      node.playerControlWeight = Math.max(0, node.playerControlWeight - 0.12 * (1 + (100 - state.globalStability) / 100));

      // Spy reports trigger leakage alerts
      if (node.playerControlWeight > 40 && Math.random() < 0.08) {
        // Generate diplomatic intercept reports based on intelligence controls
        if (node.type === 'Intelligence') {
          const TargetNation = Object.keys(state.countries)[Math.floor(Math.random() * Object.keys(state.countries).length)];
          const actionProposal = Math.random() > 0.5 ? 'RATE_HIKE' : 'STABILITY_CRACKDOWN';
          
          state.cables.push({
            time: `${defaultDate} 04:30:12`,
            source: node.id.toUpperCase(),
            message: `INTERCEPT: Security cabinet in ${TargetNation} drafting a ${actionProposal} plan for coming quarter cycle. Pre-alert active.`,
            classification: 'TOP_SECRET'
          });
        }
      }
    });

    return state;
  }

  // --- VI. DYNASTY MANAGEMENT: GENETIC CAPITAL & PRESTIGE ---
  private static tickDynasty(state: SimState): SimState {
    // Family aging process
    if (state.currentTick % 52 === 0) {
      state.dynasty.members.forEach((m: DynastyMember) => {
        m.age++;
        if (m.age > 82 && Math.random() < 0.28) {
          m.status = 'Deceased';
          state.cables.push({
            time: `${state.date} 06:00:00`,
            source: 'DYNASTY_CHAMBER',
            message: `LINEAGE SHIFT: ${m.name}, Dynastic Pioneer, has expired aged ${m.age}. Direct succession processing.`,
            classification: 'CONFIDENTIAL'
          });

          // Core succession trigger
          this.triggerLineageSuccession(state, m);
        }
      });
    }

    // High global suffering induces baseline prestige penalty unless the hierarchy has somatic edits
    const activeHead = state.dynasty.members.find(m => m.role === 'Head of Dynasty' && m.status === 'Alive');
    
    if (state.globalSuffering > 55) {
      // If head lacks amoral sociopathy modifications, suffer prestige shrinkage
      const hasSociopathySomatic = activeHead ? activeHead.geneticEdits.some(e => e.includes('Amoral') || e.includes('Somatic Longevity') || e.includes('Crystalline Cortical')) : false;

      if (!hasSociopathySomatic) {
        state.dynasty.prestige = Math.max(0, state.dynasty.prestige - 0.25);
      }
    }

    return state;
  }

  private static triggerLineageSuccession(state: SimState, expiredMem: DynastyMember) {
    let heir = state.dynasty.members.find(m => m.role === 'Heir' && m.status === 'Alive');
    
    if (!heir) {
      // Spawn standard default backup heir instantly
      heir = {
        name: expiredMem.name + ' II',
        role: 'Head of Dynasty',
        age: 24,
        status: 'Alive',
        sociopathyIndex: expiredMem.sociopathyIndex,
        geneticEdits: [...expiredMem.geneticEdits]
      };
      state.dynasty.members.push(heir);
    } else {
      heir.role = 'Head of Dynasty';
    }

    // Slight prestige friction hit on transition
    state.dynasty.prestige = Math.max(20, state.dynasty.prestige - 15);
    state.dynasty.generation += 1;
  }

  // --- VII. GLOBAL SOLVENCY CHECK ---
  private static tickGlobalSolvency(state: SimState): SimState {
    // Compute aggregated Global stability as average of countries' health
    const cVals = Object.values(state.countries);
    const avgStability = cVals.reduce((sum, curr) => sum + curr.stability, 0) / cVals.length;
    const avgUnrest = cVals.reduce((sum, curr) => sum + curr.unrest, 0) / cVals.length;

    state.globalStability = Math.round(avgStability);
    state.globalSuffering = Math.round(avgUnrest);

    return state;
  }

  // --- ACTIONS INTERFACE DISPATCHERS ---

  // Cognitive Warfare Narrative Injector Bomb
  static executeCognitiveStrike(state: SimState, countryId: string, targetTicker: string): SimState {
    // Spend 10B
    if (state.player.cash < 10000000000) {
      return state;
    }

    state.player.cash -= 10000000000;

    // Trigger Narrative Bomb
    state.traumaLog.push({
      id: Math.random().toString(),
      tick: state.currentTick,
      date: state.date,
      eventType: 'COGNITIVE_WAR',
      description: `COGNITIVE WORK: Massive Narrative Injection targeting ${targetTicker} financial security systems in ${countryId}. Panic banks sequence initiated.`,
      severity: 9
    });

    // Collapse target corporate/crypto price dynamically
    const targetMarket = state.markets[targetTicker];
    if (targetMarket) {
      targetMarket.currentPrice = targetMarket.currentPrice * 0.60; // Instant 40% crash
    }

    // Pull down target country stability
    const c = state.countries[countryId];
    if (c) {
      c.unrest = Math.min(100, c.unrest + 35);
      c.stability = Math.max(0, c.stability - 25);
    }

    // Trigger chain bank run on selected host network if target ticker matches crypto chain
    const crChain = Object.values(state.cryptoChains).find(ch => ch.ticker === targetTicker);
    if (crChain) {
      crChain.bankRunTriggered = true;
    }

    state.cables.push({
      time: `${state.date} 21:05:01`,
      source: 'PSYOP_COMMAND',
      message: `BOMB DETONATED: Narrative wave flooded clearance networks. Target ticker ${targetTicker} shares dumped 40%. Central repository panic triggered.`,
      classification: 'EYES_ONLY'
    });

    state.globalStability = Math.max(0, state.globalStability - 8);
    return state;
  }

  // Genetic Somatic Capital longevity expenditure
  static investGeneticSomaticCore(state: SimState): SimState {
    // Spend $50 Trillion (50,000,000,000,000) or as much cash as available (min $5T)
    const cost = 5000000000000;
    if (state.player.cash < cost) {
      return state;
    }

    state.player.cash -= cost;

    // Find first active alive heir or head
    const heir = state.dynasty.members.find(m => m.status === 'Alive');
    if (heir) {
      heir.sociopathyIndex = Math.min(100, heir.sociopathyIndex + 30);
      heir.geneticEdits.push('Amoral Brainstem Opt-out');
      heir.geneticEdits.push('Somatic Longevity Core V4');
    }

    state.traumaLog.push({
      id: Math.random().toString(),
      tick: state.currentTick,
      date: state.date,
      eventType: 'EUGENICS_EXP',
      description: `EUGENICS UPGRADE: Dynasty member undergoes full gene somatic sequencing to enhance stress immunities against Global Suffering dynamics.`,
      severity: 7
    });

    state.cables.push({
      time: `${state.date} 03:00:00`,
      source: 'GENE_METALS',
      message: `SOMATIC COMPLETE: Transgenic sequence embedded. Sociopathy trait locked to max level. Sickness susceptibility bypassed.`,
      classification: 'EYES_ONLY'
    });

    return state;
  }

  // Printing Press Puppetry direct intervention activation toggle
  static toggleCentralBankMonetize(state: SimState, countryId: string): SimState {
    const c = state.countries[countryId];
    if (!c) return state;

    // Must have at least 80% control captured in corresponding lobby desk
    const controlNode = state.influenceNodes.find(n => n.type === 'Lobby' && n.nation === countryId);
    const weight = controlNode ? controlNode.playerControlWeight : 0;

    if (weight >= 80) {
      c.centralBank.printingPressOverride = !c.centralBank.printingPressOverride;
      
      state.cables.push({
        time: `${state.date} 10:00:00`,
        source: 'Sovereign_Desk',
        message: `PUPPET PRESS: Monetization Override toggled for ${c.name}. State: ${c.centralBank.printingPressOverride ? 'ACTIVE_HYPER_FLOW' : 'STANDBY'}`,
        classification: 'TOP_SECRET'
      });
    }

    return state;
  }
}
