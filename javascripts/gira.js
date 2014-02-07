var LABEL_REGEX=/^\d+-(\w+)/,Gira=function(a,b,c,d){this.username=a,this.repo=b,this.owner=a,this.milestone=d||"",this.last_label="",this.github=c,this.milestones={},this.owners={}};Gira.prototype={groupIssuesByLabels:function(){var a=this;return Q.all([this.github.getIssues(this.owner,this.repo,this.milestone),this.github.getLabels(this.owner,this.repo)]).then(function(b){var c=b[0],d=_(b[1]).filter(function(a){return LABEL_REGEX.test(a.name)}),e=_(c).groupBy(function(a){var b=_(a.labels).find(function(a){return LABEL_REGEX.test(a.name)});return b?b.name:"0-Backlog"});return _.chain(d.concat({name:"0-Backlog"})).sortBy(function(a){return a.name}).uniq(!0,function(a){return a.name}).tap(function(b){a.last_label=b[b.length-1].name}).map(function(a){return[a.name,e[a.name]]}).value()},function(a){console.log(a)})},draggablify:function(){var a=this,b=$("#contributions-calendar .contrib-details.grid .col .lbl div[draggable=true]");b.on("dragstart",function(a){a.originalEvent.dataTransfer.effectAllowed="move",a.originalEvent.dataTransfer.setData("text/plain",this.id)}),$(".col").on("dragover",function(a){return a.preventDefault&&a.preventDefault(),$(this).removeClass("over").addClass("over"),a.originalEvent.dataTransfer.dropEffect="move",!1}).on("drop",function(b){b.stopPropagation&&b.stopPropagation();var c=$("#"+b.originalEvent.dataTransfer.getData("text/plain"));return a.github.deleteLabel(a.owner,a.repo,c.attr("id"),c.data("label")),a.github.addLabel(a.owner,a.repo,c.attr("id"),this.id),$(this).removeClass("over").find("span.lbl").append($(c)),!1})},changeOwner:function(a){this.owner=$(a.target).attr("name"),this.renderRepoSelector()},changeRepo:function(a){this.repo=$(a.target).attr("name"),this.renderKanban()},renderRepoSelector:function(){var a=this;if(this.github.checkLogin())this.github.getRepos().then(function(b){var c=_(b).groupBy(function(a){return a.owner.login});a.repo=a.repo||c[a.owner][0].name;var d={checked:a.owner,checkedRepo:a.repo,owners:_(c).map(function(a){return a[0].owner}),repos:c[a.owner]},e=nunjucks.render("src/templates/repo-selector.html",d);$(".pagehead.repohead h1").html(e),$(".select-menu.owner-select-menu input[type=radio]").on("change",a.changeOwner.bind(a)),$(".target-repo-menu.select-menu input[type=radio]").on("change",a.changeRepo.bind(a))},function(b){console.log("get repo error",b);var c=nunjucks.render("src/templates/repo-selector.html",{username:a.username,repo:a.repo});$(".pagehead.repohead h1").html(c)});else{var b=nunjucks.render("src/templates/repo-selector.html",{username:a.username,repo:a.repo});$(".pagehead.repohead h1").html(b)}},renderKanban:function(){var a=this;return this.groupIssuesByLabels().then(function(b){var c=mynunjucks.render("src/templates/gira.html",{issuesWithLabel:b,last_label:a.last_label});$("#contributions-calendar").html(c)},function(a){console.log("kanban",a)})},renderHeader:function(){var a=this;this.github.checkLogin()?this.github.getUser().then(function(b){a.owner=a.owner||b.login,$(".header").html(nunjucks.render("src/templates/header.html",{user:b})),$(".octicon.octicon-log-out").click(a.github.logout)},function(){$(".header").html(nunjucks.render("src/templates/header.html"))}):$(".header").html(nunjucks.render("src/templates/header.html"))},renderMilestone:function(){var a=this;this.github.getMilestones(this.owner,this.repo).then(function(b){$(".pagehead.repohead div.sidebar-milestone-widget").html(mynunjucks.render("src/templates/milestones.html",{selected:a.milestone&&_(b).find(function(b){return b.number===a.milestone}),milestones:b})),$(".sidebar-milestone-widget .select-menu a.select-menu-item").click(function(b){return b.preventDefault(),a.milestone=$(this).data("milestone"),a.render(),!1})})},createLabel:function(){var a=this;return function(){var b=$("form:visible");return a.github.createLabel(a.owner,a.repo,{color:b.find("input[name=color]").val().replace("#",""),name:parseInt(/^(\d+)-\w+/.exec(a.last_label).pop())+1+"-"+b.find("input[name=label]").val()}).then(function(){a.render(),$(".facebox-close").click()}),!1}},createIssue:function(){var a=this;return function(){var b=$("form:visible");return a.github.newIssue(a.owner,a.repo,{title:b.find("input[name='issue[title]']").val(),body:b.find("textarea[name='issue[body]']").val(),assignee:b.find(".assignee input[type=radio]:checked").val(),milestone:b.find(".milestone input[type=radio]:checked").val(),labels:b.find("a.selected input").get().map(function(a){return a.value})},b.data("issue-id")).then(function(){a.render(),$(".facebox-close").click()}),!1}},renderFaceBox:function(){var a=this;return function(b){return b.preventDefault(),"new-issue"===this.id?$(".facebox-content:visible").html(nunjucks.render("src/templates/create-issue.html")):"new-label"===this.id?$(".facebox-content:visible").html(nunjucks.render("src/templates/create-label.html")):a.github.getIssues(a.owner,a.repo,null,$(this).data("issue-id")).then(function(a){console.log(a),$(".facebox-content").html(nunjucks.render("src/templates/create-issue.html",a))}),!1}},render:function(){var a=this;this.renderHeader(),this.renderKanban().then(a.draggablify.bind(this)).then(function(){$("a[rel=facebox]").click(a.renderFaceBox())}),this.renderRepoSelector(),this.renderMilestone()}};