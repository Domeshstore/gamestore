          {/* Info card */}
          <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
            <h1 className="text-white font-black text-xl mb-1">{game.name}</h1>
            <p className="text-slate-400 text-sm">{game.publisher}</p>
            {game.description && (
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">{game.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {game.platform.map(p => (
                <span key={p} className="px-2 py-1 rounded-lg text-xs" style={{ background: '#ea523420', color: '#ea5234' }}>
                  {p}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(234, 82, 52, 0.2)' }}>
              {[
                ['Kategori', game.category],
                ['Provider', game.provider],
                ['Game Code', game.gameCode],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-slate-500">{l}</span>
                  <span className="text-slate-300 capitalize font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>