

export function expand(url: string | undefined){
    if(url){
        const tint = document.getElementById('tint');

        const img = document.createElement('img');
        img.src = url;
        img.style.width = "80vw";
        img.style.height = "80vh";
        img.style.objectFit = "contain";

        tint?.appendChild(img);

        if(tint){
            tint.style.display = 'flex';
        }
    }
}

function hide(){
    const tint = document.getElementById('tint');
    
    const images = tint?.getElementsByTagName('img');
    
    if(images && images?.length > 0){
        tint?.removeChild(images[0])
    }

    if(tint){
        tint.style.display = 'none';
    }
}

export function BenchmarkImageExpander(){
    return (
        <>
            <div id="tint" style={{
                display: "none", 
                backgroundColor: "rgba(40, 40, 40, 0.4)", 
                zIndex: "9999",
                position: "fixed", 
                width: "100vw", 
                height: "100vh",
                top: 0,
                left: 0,
                justifyContent: "center",
                alignItems: "center"
                }}>
                <button onClick={hide} style={{
                    width: "25px",
                    height: "25px",
                    backgroundColor: "#940b0b",
                    borderRadius: "50%",
                    textAlign: "center",
                    border: "#fff 2px solid",
                    color: "#fff",
                    fontSize: "13px",
                    position: "absolute",
                    right: "40px",
                    top: "20px"
                }}>X</button> 
            </div>
        </>
    )
}