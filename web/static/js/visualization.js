// Go Version Trace - Visualization JavaScript

class GoVersionVisualization {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.margin = { top: 50, right: 50, bottom: 100, left: 200 };
        this.width = 1000 - this.margin.left - this.margin.right;
        this.height = 600 - this.margin.bottom - this.margin.top;
        this.data = null;
    }

    async loadData() {
        try {
            const response = await fetch('/api/visualization');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            throw error;
        }
    }

    createVisualization() {
        if (!this.data || !this.data.packages || this.data.packages.length === 0) {
            this.showNoDataMessage();
            return;
        }

        this.container.html('');
        
        const svg = this.container
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // データの準備
        const releases = this.data.releases || [];
        const packages = this.data.packages || [];
        
        if (releases.length === 0) {
            this.showNoDataMessage();
            return;
        }

        // スケールの設定
        const xScale = d3.scaleTime()
            .domain(d3.extent(releases, d => new Date(d.release_date)))
            .range([0, this.width]);

        const yScale = d3.scaleBand()
            .domain(packages)
            .range([0, this.height])
            .paddingInner(0.1);

        const colorScale = d3.scaleOrdinal()
            .domain(['Added', 'Modified', 'Deprecated', 'Removed'])
            .range(['#28a745', '#ffc107', '#fd7e14', '#dc3545']);

        // 軸の描画
        g.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%Y/%m')));

        g.append('g')
            .call(d3.axisLeft(yScale));

        // 軸ラベル
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left + 20)
            .attr('x', 0 - (this.height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('標準ライブラリパッケージ');

        g.append('text')
            .attr('transform', `translate(${this.width / 2}, ${this.height + this.margin.bottom - 20})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('リリース日');

        // タイトル
        svg.append('text')
            .attr('x', (this.width + this.margin.left + this.margin.right) / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text('Go標準ライブラリの変更履歴');

        // パッケージ進化の可視化
        this.drawPackageEvolution(g, xScale, yScale, colorScale);

        // 凡例の追加
        this.drawLegend(svg, colorScale);
    }

    drawPackageEvolution(g, xScale, yScale, colorScale) {
        const packageEvolution = this.data.package_evolution || {};
        const releases = this.data.releases || [];

        Object.keys(packageEvolution).forEach(packageName => {
            const evolution = packageEvolution[packageName];
            if (!evolution || evolution.length === 0) return;

            const y = yScale(packageName) + yScale.bandwidth() / 2;

            // パッケージラインの描画
            const line = d3.line()
                .x(d => {
                    const release = releases.find(r => r.version === d.version);
                    return release ? xScale(new Date(release.release_date)) : 0;
                })
                .y(d => y)
                .curve(d3.curveMonotoneX);

            g.append('path')
                .datum(evolution)
                .attr('fill', 'none')
                .attr('stroke', '#ccc')
                .attr('stroke-width', 2)
                .attr('d', line);

            // 変更点の描画
            evolution.forEach(change => {
                const release = releases.find(r => r.version === change.version);
                if (!release) return;

                const x = xScale(new Date(release.release_date));
                const color = colorScale(change.change_type);

                g.append('circle')
                    .attr('cx', x)
                    .attr('cy', y)
                    .attr('r', 6)
                    .attr('fill', color)
                    .attr('stroke', 'white')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer')
                    .on('mouseover', (event) => {
                        this.showTooltip(event, {
                            package: packageName,
                            version: change.version,
                            changeType: change.change_type,
                            description: change.description,
                            releaseDate: release.release_date
                        });
                    })
                    .on('mouseout', () => {
                        this.hideTooltip();
                    });
            });
        });
    }

    drawLegend(svg, colorScale) {
        const legend = svg.append('g')
            .attr('transform', `translate(${this.width + this.margin.left - 100}, ${this.margin.top})`);

        const legendItems = colorScale.domain();
        
        legend.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .style('font-weight', 'bold')
            .text('変更種別');

        const legendItem = legend.selectAll('.legend-item')
            .data(legendItems)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItem.append('circle')
            .attr('cx', 6)
            .attr('cy', 6)
            .attr('r', 6)
            .attr('fill', d => colorScale(d));

        legendItem.append('text')
            .attr('x', 20)
            .attr('y', 6)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(d => this.translateChangeType(d));
    }

    translateChangeType(type) {
        const translations = {
            'Added': '追加',
            'Modified': '変更',
            'Deprecated': '非推奨',
            'Removed': '削除'
        };
        return translations[type] || type;
    }

    showTooltip(event, data) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.9)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('z-index', 1000);

        tooltip.html(`
            <strong>${data.package}</strong><br/>
            バージョン: Go ${data.version}<br/>
            変更種別: ${this.translateChangeType(data.changeType)}<br/>
            リリース日: ${new Date(data.releaseDate).toLocaleDateString('ja-JP')}<br/>
            <div style="margin-top: 5px; font-size: 11px;">
                ${data.description}
            </div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }

    hideTooltip() {
        d3.selectAll('.tooltip').remove();
    }

    showNoDataMessage() {
        this.container.html(`
            <div class="no-data" style="text-align: center; padding: 50px;">
                <h3>データがありません</h3>
                <p>標準ライブラリの変更データを表示するには、先にデータを取得してください。</p>
                <button class="btn" onclick="refreshData()">データを取得</button>
            </div>
        `);
    }

    showError(message) {
        this.container.html(`
            <div class="error" style="text-align: center; padding: 50px;">
                <h3>エラーが発生しました</h3>
                <p>${message}</p>
                <button class="btn" onclick="location.reload()">再読み込み</button>
            </div>
        `);
    }

    async render() {
        try {
            this.container.html('<div class="loading">データを読み込み中...</div>');
            await this.loadData();
            this.createVisualization();
        } catch (error) {
            console.error('可視化の作成に失敗しました:', error);
            this.showError(error.message);
        }
    }
}

// ユーティリティ関数
async function refreshData() {
    try {
        const button = event.target;
        button.disabled = true;
        button.textContent = '更新中...';

        const response = await fetch('/api/refresh', { method: 'POST' });
        const result = await response.json();
        
        if (response.ok) {
            location.reload();
        } else {
            throw new Error(result.message || 'データ更新に失敗しました');
        }
    } catch (error) {
        alert('エラー: ' + error.message);
        button.disabled = false;
        button.textContent = 'データを取得';
    }
}

function createSimpleChart() {
    const container = d3.select('#visualization');
    
    fetch('/api/visualization')
        .then(response => response.json())
        .then(data => {
            container.html('');
            
            if (!data.packages || data.packages.length === 0) {
                container.html('<div class="no-data">データがありません。先にデータを取得してください。</div>');
                return;
            }

            // シンプルなテーブル表示
            let html = '<h2>パッケージ変更履歴</h2>';
            html += '<table class="table" style="width:100%; border-collapse: collapse; margin-top: 20px;">';
            html += '<thead><tr style="background: #007d9c; color: white;"><th style="padding: 10px; border: 1px solid #ddd;">パッケージ</th><th style="padding: 10px; border: 1px solid #ddd;">変更数</th></tr></thead>';
            html += '<tbody>';
            
            data.packages.forEach(pkg => {
                const changeCount = data.package_evolution[pkg] ? data.package_evolution[pkg].length : 0;
                html += `<tr><td style="padding: 10px; border: 1px solid #ddd;">${pkg}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${changeCount}</td></tr>`;
            });
            
            html += '</tbody></table>';
            container.html(html);
        })
        .catch(error => {
            console.error('Error:', error);
            container.html('<div class="error">データの読み込みに失敗しました。</div>');
        });
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('visualization')) {
        // D3.jsが利用可能かチェック
        if (typeof d3 !== 'undefined') {
            const viz = new GoVersionVisualization('#visualization');
            viz.render();
        } else {
            // D3.jsが読み込まれていない場合はシンプルな表示
            createSimpleChart();
        }
    }
});